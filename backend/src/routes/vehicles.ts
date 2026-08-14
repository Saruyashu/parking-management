import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, vehicle_number, start_date, end_date } = req.query;

    const where: any = {};
    if (status === 'active') {
      where.exit_time = null;
    } else if (status === 'exited') {
      where.exit_time = { not: null };
    }
    if (vehicle_number) {
      where.vehicle_number = { contains: vehicle_number as string, mode: 'insensitive' };
    }
    if (start_date) {
      where.entry_time = { ...where.entry_time, gte: new Date(start_date as string) };
    }
    if (end_date) {
      where.entry_time = { ...where.entry_time, lte: new Date(end_date as string) };
    }

    const logs = await prisma.vehicleLog.findMany({
      where,
      include: {
        slot: { include: { zone: true } },
        invoice: true
      },
      orderBy: { entry_time: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle logs' });
  }
});

router.post('/entry', authenticate, authorize('OWNER', 'SUPERVISOR', 'ATTENDANT', 'CASHIER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      slot_id: z.string(),
      vehicle_number: z.string(),
      category: z.enum(['TWO_WHEELER', 'FOUR_WHEELER', 'EV'])
    });

    const data = schema.parse(req.body);

    // Check if vehicle is blacklisted
    const blacklisted = await prisma.blacklist.findUnique({
      where: { vehicle_number: data.vehicle_number.toUpperCase() }
    });
    if (blacklisted) {
      res.status(403).json({ error: 'Vehicle is blacklisted', reason: blacklisted.reason });
      return;
    }

    // Check if slot is available
    const slot = await prisma.slot.findUnique({ where: { id: data.slot_id } });
    if (!slot) {
      res.status(404).json({ error: 'Slot not found' });
      return;
    }
    if (slot.status !== 'AVAILABLE') {
      res.status(400).json({ error: 'Slot is not available' });
      return;
    }

    // Get pricing
    const pricing = await prisma.pricingRule.findFirst({
      where: { category: data.category as any, is_active: true }
    });

    // Create vehicle log
    const vehicleLog = await prisma.vehicleLog.create({
      data: {
        slot_id: data.slot_id,
        vehicle_number: data.vehicle_number.toUpperCase(),
        category: data.category as any,
        rate_applied: pricing?.hourly_rate || 0,
        total_amount: 0,
        gst_amount: 0
      },
      include: { slot: true }
    });

    // Update slot status
    await prisma.slot.update({
      where: { id: data.slot_id },
      data: { status: 'OCCUPIED' }
    });

    res.status(201).json(vehicleLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to log vehicle entry' });
  }
});

router.post('/exit/:id', authenticate, authorize('OWNER', 'SUPERVISOR', 'ATTENDANT', 'CASHIER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      payment_mode: z.enum(['CASH', 'UPI', 'CARD', 'WALLET', 'MONTHLY_PASS']),
      payment_status: z.enum(['PAID', 'WAIVED']).default('PAID')
    });

    const data = schema.parse(req.body);

    const vehicleLog = await prisma.vehicleLog.findUnique({
      where: { id: req.params.id },
      include: { slot: true }
    });

    if (!vehicleLog) {
      res.status(404).json({ error: 'Vehicle log not found' });
      return;
    }
    if (vehicleLog.exit_time) {
      res.status(400).json({ error: 'Vehicle already exited' });
      return;
    }

    const exitTime = new Date();
    const durationMs = exitTime.getTime() - vehicleLog.entry_time.getTime();
    const durationMinutes = Math.ceil(durationMs / 60000);

    // Calculate amount (hourly rate * hours, minimum 1 hour)
    const hours = Math.max(1, Math.ceil(durationMinutes / 60));
    const totalAmount = vehicleLog.rate_applied * hours;
    const gstAmount = Math.round(totalAmount * 0.18);
    const grandTotal = totalAmount + gstAmount;

    // Update vehicle log
    const updatedLog = await prisma.vehicleLog.update({
      where: { id: req.params.id },
      data: {
        exit_time: exitTime,
        duration_minutes: durationMinutes,
        total_amount: totalAmount,
        gst_amount: gstAmount,
        payment_mode: data.payment_mode as any,
        payment_status: data.payment_status as any
      }
    });

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}`;
    await prisma.invoice.create({
      data: {
        vehicle_log_id: vehicleLog.id,
        invoice_number: invoiceNumber,
        subtotal: totalAmount,
        gst_amount: gstAmount,
        total: grandTotal
      }
    });

    // Free the slot
    await prisma.slot.update({
      where: { id: vehicleLog.slot_id },
      data: { status: 'AVAILABLE' }
    });

    res.json({ ...updatedLog, invoice_number: invoiceNumber, grand_total: grandTotal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process vehicle exit' });
  }
});

router.get('/active', authenticate, async (req: AuthRequest, res) => {
  try {
    const activeVehicles = await prisma.vehicleLog.findMany({
      where: { exit_time: null },
      include: {
        slot: { include: { zone: true } }
      },
      orderBy: { entry_time: 'desc' }
    });

    const count = activeVehicles.length;
    const byCategory = {
      TWO_WHEELER: activeVehicles.filter(v => v.category === 'TWO_WHEELER').length,
      FOUR_WHEELER: activeVehicles.filter(v => v.category === 'FOUR_WHEELER').length,
      EV: activeVehicles.filter(v => v.category === 'EV').length
    };

    res.json({ vehicles: activeVehicles, count, byCategory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active vehicles' });
  }
});

router.post('/blacklist', authenticate, authorize('OWNER', 'SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      vehicle_number: z.string(),
      reason: z.string()
    });

    const data = schema.parse(req.body);

    const entry = await prisma.blacklist.upsert({
      where: { vehicle_number: data.vehicle_number.toUpperCase() },
      update: { reason: data.reason },
      create: {
        vehicle_number: data.vehicle_number.toUpperCase(),
        reason: data.reason,
        created_by: req.user!.id
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to blacklist vehicle' });
  }
});

export default router;
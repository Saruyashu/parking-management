import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/people', authenticate, async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        vehicles: true,
        _count: { select: { monthly_passes: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/people', authenticate, authorize('OWNER', 'SUPERVISOR', 'CASHIER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      phone: z.string().min(5),
      email: z.string().email().optional(),
      vehicle_number: z.string().optional()
    });

    const data = schema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        vehicles: data.vehicle_number
          ? { create: [{ vehicle_number: data.vehicle_number.toUpperCase() }] }
          : undefined
      },
      include: { vehicles: true }
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const passes = await prisma.monthlyPass.findMany({
      where: {
        ...(status && { status: status as any })
      },
      include: {
        customer: true,
        slot: { include: { zone: true } },
        corporate_account: true,
        payments: { orderBy: { payment_date: 'desc' }, take: 3 }
      },
      orderBy: { end_date: 'asc' }
    });

    res.json(passes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch passes' });
  }
});

router.post('/', authenticate, authorize('OWNER', 'SUPERVISOR', 'CASHIER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      customer_id: z.string(),
      slot_id: z.string(),
      pass_type: z.enum(['INDIVIDUAL', 'FAMILY', 'CORPORATE']),
      corporate_account_id: z.string().optional(),
      vehicle_number: z.string(),
      start_date: z.string().or(z.date()),
      end_date: z.string().or(z.date()),
      amount: z.number().int().positive(),
      auto_renew: z.boolean().optional()
    });

    const data = schema.parse(req.body);

    // Check slot availability
    const existingPass = await prisma.monthlyPass.findFirst({
      where: { slot_id: data.slot_id, status: 'ACTIVE' }
    });
    if (existingPass) {
      res.status(409).json({ error: 'Slot already has an active pass' });
      return;
    }

    const gstAmount = Math.round(data.amount * 0.18);
    const total = data.amount + gstAmount;

    const pass = await prisma.monthlyPass.create({
      data: {
        customer_id: data.customer_id,
        slot_id: data.slot_id,
        pass_type: data.pass_type,
        corporate_account_id: data.corporate_account_id,
        vehicle_number: data.vehicle_number.toUpperCase(),
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        amount: data.amount,
        gst_amount: gstAmount,
        total,
        auto_renew: data.auto_renew || false
      },
      include: {
        customer: true,
        slot: { include: { zone: true } }
      }
    });

    // Mark slot as reserved
    await prisma.slot.update({
      where: { id: data.slot_id },
      data: { is_reserved: true }
    });

    // Create customer vehicle if not exists
    await prisma.customerVehicle.upsert({
      where: { vehicle_number: data.vehicle_number.toUpperCase() },
      update: { customer_id: data.customer_id },
      create: {
        customer_id: data.customer_id,
        vehicle_number: data.vehicle_number.toUpperCase()
      }
    });

    res.status(201).json(pass);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create pass' });
  }
});

router.get('/expiring', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const expiringPasses = await prisma.monthlyPass.findMany({
      where: {
        status: 'ACTIVE',
        end_date: {
          gte: today,
          lte: in7Days
        }
      },
      include: {
        customer: true,
        slot: { include: { zone: true } }
      }
    });

    res.json(expiringPasses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expiring passes' });
  }
});

router.patch('/:id/renew', authenticate, authorize('OWNER', 'SUPERVISOR', 'CASHIER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      new_end_date: z.string().or(z.date()),
      amount: z.number().int().positive()
    });

    const data = schema.parse(req.body);

    const pass = await prisma.monthlyPass.update({
      where: { id: req.params.id },
      data: {
        end_date: new Date(data.new_end_date),
        status: 'ACTIVE'
      }
    });

    res.json(pass);
  } catch (error) {
    res.status(500).json({ error: 'Failed to renew pass' });
  }
});

router.patch('/:id/suspend', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const pass = await prisma.monthlyPass.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED' }
    });

    await prisma.slot.update({
      where: { id: pass.slot_id },
      data: { is_reserved: false }
    });

    res.json(pass);
  } catch (error) {
    res.status(500).json({ error: 'Failed to suspend pass' });
  }
});

export default router;
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { zone_id, category, status } = req.query;

    const slots = await prisma.slot.findMany({
      where: {
        ...(zone_id && { zone_id: zone_id as string }),
        ...(category && { category: category as any }),
        ...(status && { status: status as any })
      },
      include: {
        zone: { include: { parking_lot: true } },
        monthly_pass: { include: { customer: true } }
      },
      orderBy: { slot_number: 'asc' }
    });

    const total = slots.length;
    const occupied = slots.filter(s => s.status === 'OCCUPIED').length;
    const available = slots.filter(s => s.status === 'AVAILABLE').length;
    const reserved = slots.filter(s => s.status === 'RESERVED').length;

    res.json({ slots, summary: { total, occupied, available, reserved } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

router.get('/pricing', authenticate, async (req: AuthRequest, res) => {
  try {
    const pricing = await prisma.pricingRule.findMany({
      where: { is_active: true },
      orderBy: { category: 'asc' }
    });
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

router.patch('/pricing/:id', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      hourly_rate: z.number().int().min(0).optional(),
      daily_rate: z.number().int().min(0).optional(),
      monthly_rate: z.number().int().min(0).optional(),
      event_rate: z.number().int().min(0).optional(),
      overnight_rate: z.number().int().min(0).optional(),
      corporate_rate: z.number().int().min(0).optional()
    });

    const data = schema.parse(req.body);

    const pricing = await prisma.pricingRule.update({
      where: { id: req.params.id },
      data
    });

    res.json(pricing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const slot = await prisma.slot.findUnique({
      where: { id: req.params.id },
      include: {
        zone: { include: { parking_lot: true } },
        monthly_pass: { include: { customer: true } },
        vehicles: {
          where: { exit_time: null },
          orderBy: { entry_time: 'desc' },
          take: 1
        }
      }
    });
    if (!slot) {
      res.status(404).json({ error: 'Slot not found' });
      return;
    }
    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slot' });
  }
});

router.post('/', authenticate, authorize('OWNER', 'SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      zone_id: z.string(),
      slot_number: z.string(),
      category: z.enum(['TWO_WHEELER', 'FOUR_WHEELER', 'EV', 'HANDICAPPED', 'PREMIUM']),
      has_charger: z.boolean().optional()
    });

    const data = schema.parse(req.body);

    const slot = await prisma.slot.create({
      data: {
        zone_id: data.zone_id,
        slot_number: data.slot_number,
        category: data.category,
        has_charger: data.has_charger || false
      },
      include: { zone: true }
    });

    res.status(201).json(slot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({ error: 'Slot number already exists in this zone' });
      return;
    }
    res.status(500).json({ error: 'Failed to create slot' });
  }
});

router.patch('/:id/status', authenticate, authorize('OWNER', 'SUPERVISOR', 'ATTENDANT'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED', 'MAINTENANCE'])
    });

    const data = schema.parse(req.body);

    const slot = await prisma.slot.update({
      where: { id: req.params.id },
      data: { status: data.status }
    });

    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update slot status' });
  }
});

export default router;
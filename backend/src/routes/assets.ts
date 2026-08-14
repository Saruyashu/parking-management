import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        vendor: true,
        maintenance_logs: { orderBy: { date: 'desc' }, take: 5 }
      },
      orderBy: { name: 'asc' }
    });

    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.post('/', authenticate, authorize('OWNER', 'SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      name: z.string(),
      category: z.string(),
      purchase_date: z.string().or(z.date()),
      purchase_cost: z.number().int().positive(),
      vendor_id: z.string().optional(),
      warranty_expiry: z.string().or(z.date()).optional(),
      next_service_due: z.string().or(z.date()).optional()
    });

    const data = schema.parse(req.body);

    const asset = await prisma.asset.create({
      data: {
        name: data.name,
        category: data.category,
        purchase_date: new Date(data.purchase_date),
        purchase_cost: data.purchase_cost,
        vendor_id: data.vendor_id,
        warranty_expiry: data.warranty_expiry ? new Date(data.warranty_expiry) : null,
        next_service_due: data.next_service_due ? new Date(data.next_service_due) : null
      }
    });

    res.status(201).json(asset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

router.post('/:id/maintenance', authenticate, authorize('OWNER', 'SUPERVISOR', 'ATTENDANT'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      date: z.string().or(z.date()),
      description: z.string(),
      cost: z.number().int().min(0),
      vendor_id: z.string().optional(),
      receipt_url: z.string().optional()
    });

    const data = schema.parse(req.body);

    const log = await prisma.maintenanceLog.create({
      data: {
        asset_id: req.params.id,
        date: new Date(data.date),
        description: data.description,
        cost: data.cost,
        vendor_id: data.vendor_id,
        receipt_url: data.receipt_url
      }
    });

    // Update asset last service date
    await prisma.asset.update({
      where: { id: req.params.id },
      data: { last_service_date: new Date(data.date) }
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log maintenance' });
  }
});

router.get('/due-for-service', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();

    const assets = await prisma.asset.findMany({
      where: {
        next_service_due: { lte: today },
        condition: { not: 'FAULTY' }
      }
    });

    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets due for service' });
  }
});

export default router;
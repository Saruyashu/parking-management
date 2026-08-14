import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category } = req.query;

    const vendors = await prisma.vendor.findMany({
      where: category ? { category: category as string } : undefined,
      orderBy: { business_name: 'asc' }
    });

    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

router.post('/', authenticate, authorize('OWNER', 'SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      business_name: z.string(),
      contact_person: z.string(),
      phone: z.string(),
      gstin: z.string().optional(),
      category: z.string(),
      bank_name: z.string().optional(),
      account_number: z.string().optional(),
      ifsc_code: z.string().optional()
    });

    const data = schema.parse(req.body);

    const vendor = await prisma.vendor.create({ data });
    res.status(201).json(vendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        expenses: { orderBy: { date: 'desc' }, take: 10 },
        maintenance_logs: { orderBy: { date: 'desc' }, take: 10 }
      }
    });
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

export default router;
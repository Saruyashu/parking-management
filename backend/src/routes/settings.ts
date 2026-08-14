import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

const getLot = async () => {
  return prisma.parkingLot.findFirst();
};

// GET payment settings (UPI details used to build QR codes)
router.get('/payment', authenticate, async (req: AuthRequest, res) => {
  try {
    const lot = await getLot();
    if (!lot) {
      res.status(404).json({ error: 'Parking lot not configured' });
      return;
    }
    res.json({
      upi_id: lot.upi_id || '',
      payee_name: lot.payee_name || lot.name,
      business_name: lot.name,
      gstin: lot.gstin || '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// PATCH payment settings
router.patch('/payment', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      upi_id: z.string().optional(),
      payee_name: z.string().optional(),
      gstin: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const lot = await getLot();
    if (!lot) {
      res.status(404).json({ error: 'Parking lot not configured' });
      return;
    }

    const updated = await prisma.parkingLot.update({
      where: { id: lot.id },
      data: {
        ...(data.upi_id !== undefined && { upi_id: data.upi_id }),
        ...(data.payee_name !== undefined && { payee_name: data.payee_name }),
        ...(data.gstin !== undefined && { gstin: data.gstin }),
      },
    });

    res.json({
      upi_id: updated.upi_id || '',
      payee_name: updated.payee_name || updated.name,
      business_name: updated.name,
      gstin: updated.gstin || '',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

export default router;
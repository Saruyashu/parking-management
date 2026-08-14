import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true, created_at: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/:id', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      role: z.enum(['OWNER', 'SUPERVISOR', 'ATTENDANT', 'CASHIER']).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional()
    });

    const data = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
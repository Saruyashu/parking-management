import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category, status, start_date, end_date } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date.gte = new Date(start_date as string);
      if (end_date) where.date.lte = new Date(end_date as string);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vendor: true,
        approved_by_user: { select: { name: true } },
        created_by_user: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    res.json({ expenses, summary: { total, byCategory, count: expenses.length } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', authenticate, authorize('OWNER', 'SUPERVISOR', 'ATTENDANT'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      date: z.string().or(z.date()),
      category: z.enum(['STAFF_WAGES', 'UTILITIES', 'MAINTENANCE', 'SECURITY', 'RENT_LEASE', 'EQUIPMENT', 'VENDOR', 'TAX_LICENSE', 'SOFTWARE', 'INSURANCE', 'MISCELLANEOUS']),
      sub_category: z.string().optional(),
      vendor_id: z.string().optional(),
      amount: z.number().int().positive(),
      payment_mode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']),
      reference_number: z.string().optional(),
      description: z.string().optional(),
      attachments: z.array(z.string()).optional(),
      is_recurring: z.boolean().optional(),
      recurrence_frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
      recurrence_end_date: z.string().or(z.date()).optional()
    });

    const data = schema.parse(req.body);

    // Require attachment for amounts > 5000
    if (data.amount > 500000 && (!data.attachments || data.attachments.length === 0)) {
      res.status(400).json({ error: 'Receipt attachment required for expenses above ₹5,000' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(data.date),
        category: data.category,
        sub_category: data.sub_category,
        vendor_id: data.vendor_id,
        amount: data.amount,
        payment_mode: data.payment_mode,
        reference_number: data.reference_number,
        description: data.description,
        attachments: data.attachments || [],
        is_recurring: data.is_recurring || false,
        recurrence_frequency: data.recurrence_frequency,
        recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date) : null,
        status: 'PENDING',
        created_by: req.user!.id
      },
      include: {
        vendor: true,
        created_by_user: { select: { name: true } }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        new_value: expense,
        ip_address: req.ip
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.patch('/:id/approve', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approved_by: req.user!.id,
        approved_at: new Date()
      },
      include: {
        vendor: true,
        approved_by_user: { select: { name: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'APPROVE',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        old_value: { status: 'PENDING' },
        new_value: { status: 'APPROVED' },
        ip_address: req.ip
      }
    });

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve expense' });
  }
});

router.patch('/:id/flag', authenticate, authorize('OWNER', 'SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      reason: z.string()
    });

    const data = schema.parse(req.body);

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        status: 'FLAGGED',
        flag_reason: data.reason
      }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'FLAG',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        old_value: { status: 'PENDING' },
        new_value: { status: 'FLAGGED', reason: data.reason },
        ip_address: req.ip
      }
    });

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to flag expense' });
  }
});

router.get('/pending', authenticate, async (req: AuthRequest, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { status: 'PENDING' },
      include: {
        vendor: true,
        created_by_user: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending expenses' });
  }
});

export default router;
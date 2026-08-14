import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { shift, status } = req.query;

    const staff = await prisma.staff.findMany({
      where: {
        ...(shift && { shift: shift as any }),
        ...(status && { status: status as any })
      },
      orderBy: { name: 'asc' }
    });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

router.post('/', authenticate, authorize('OWNER', 'SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      name: z.string(),
      phone: z.string(),
      aadhaar: z.string().optional(),
      address: z.string().optional(),
      role: z.enum(['ATTENDANT', 'SUPERVISOR', 'SECURITY', 'CLEANER', 'CASHIER']),
      employment_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTUAL']),
      shift: z.enum(['MORNING', 'AFTERNOON', 'NIGHT']),
      bank_account: z.string().optional(),
      ifsc_code: z.string().optional(),
      wage_rate: z.number().int().positive(),
      is_monthly: z.boolean(),
      joining_date: z.string().or(z.date())
    });

    const data = schema.parse(req.body);

    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar,
        address: data.address,
        role: data.role,
        employment_type: data.employment_type,
        shift: data.shift,
        bank_account: data.bank_account,
        ifsc_code: data.ifsc_code,
        wage_rate: data.wage_rate,
        is_monthly: data.is_monthly,
        joining_date: new Date(data.joining_date)
      }
    });

    res.status(201).json(staff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

router.patch('/:id/attendance', authenticate, authorize('OWNER', 'SUPERVISOR', 'ATTENDANT'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      date: z.string().or(z.date()),
      shift: z.enum(['MORNING', 'AFTERNOON', 'NIGHT']),
      status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'NOT_MARKED']),
      late_by_minutes: z.number().int().min(0).optional()
    });

    const data = schema.parse(req.body);

    const attendance = await prisma.attendance.upsert({
      where: {
        staff_id_date_shift: {
          staff_id: req.params.id,
          date: new Date(data.date),
          shift: data.shift
        }
      },
      update: {
        status: data.status,
        late_by_minutes: data.late_by_minutes,
        marked_by: req.user!.id
      },
      create: {
        staff_id: req.params.id,
        date: new Date(data.date),
        shift: data.shift,
        status: data.status,
        late_by_minutes: data.late_by_minutes,
        marked_by: req.user!.id
      },
      include: { staff: true }
    });

    res.status(201).json(attendance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

router.get('/:id/attendance', authenticate, async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query;
    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        staff_id: req.params.id,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.get('/attendance/today', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { shift } = req.query;

    const allStaff = await prisma.staff.findMany({
      where: shift ? { shift: shift as any } : undefined,
      include: {
        attendances: {
          where: {
            date: { gte: today, lt: tomorrow }
          }
        }
      }
    });

    const staffWithAttendance = allStaff.map(s => ({
      ...s,
      todayAttendance: s.attendances[0] || null
    }));

    res.json(staffWithAttendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today attendance' });
  }
});

export default router;
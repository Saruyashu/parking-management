import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/calculate/:staffId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query;
    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const staff = await prisma.staff.findUnique({ where: { id: req.params.staffId } });
    if (!staff) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    const daysInMonth = endDate.getDate();
    const workingDays = daysInMonth; // Assuming all days are working days

    const attendances = await prisma.attendance.findMany({
      where: {
        staff_id: req.params.staffId,
        date: { gte: startDate, lte: endDate }
      }
    });

    const daysPresent = attendances.filter(a => a.status === 'PRESENT').length +
                       (attendances.filter(a => a.status === 'HALF_DAY').length * 0.5);

    let basicWage = 0;
    let overtimeHours = 0;
    let overtimeAmount = 0;

    if (staff.is_monthly) {
      basicWage = Math.round((staff.wage_rate * daysPresent) / workingDays);
    } else {
      basicWage = staff.wage_rate * Math.round(daysPresent);
    }

    const payroll = await prisma.payroll.upsert({
      where: { staff_id_month_year: { staff_id: req.params.staffId, month: monthNum, year: yearNum } },
      update: {
        working_days: workingDays,
        days_present: Math.round(daysPresent),
        basic_wage: basicWage,
        overtime_hours: overtimeHours,
        overtime_amount: overtimeAmount
      },
      create: {
        staff_id: req.params.staffId,
        month: monthNum,
        year: yearNum,
        working_days: workingDays,
        days_present: Math.round(daysPresent),
        basic_wage: basicWage,
        overtime_hours: overtimeHours,
        overtime_amount: overtimeAmount,
        net_payable: basicWage
      }
    });

    res.json({ ...payroll, staff });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
});

router.post('/pay/:id', authenticate, authorize('OWNER'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      payment_mode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER'])
    });

    const data = schema.parse(req.body);

    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: {
        status: 'PAID',
        paid_on: new Date(),
        payment_mode: data.payment_mode,
        paid_by: req.user!.id
      },
      include: { staff: true }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'APPROVE',
        entity_type: 'PAYROLL',
        entity_id: payroll.id,
        new_value: { status: 'PAID' },
        ip_address: req.ip
      }
    });

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark payroll as paid' });
  }
});

router.get('/batch', authenticate, async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query;
    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const payrolls = await prisma.payroll.findMany({
      where: { month: monthNum, year: yearNum },
      include: { staff: true }
    });

    const allStaff = await prisma.staff.findMany();
    const staffWithPayroll = allStaff.map(staff => {
      const payroll = payrolls.find(p => p.staff_id === staff.id);
      return { staff, payroll: payroll || null };
    });

    const totalPayable = payrolls
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.net_payable), 0);

    res.json({ payrolls: staffWithPayroll, totalPayable, month: monthNum, year: yearNum });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll batch' });
  }
});

export default router;
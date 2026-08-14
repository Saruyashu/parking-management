import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/daily', authenticate, async (req: AuthRequest, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Revenue
    const revenueLogs = await prisma.vehicleLog.findMany({
      where: {
        entry_time: { gte: startOfDay, lte: endOfDay },
        payment_status: 'PAID'
      }
    });

    const totalRevenue = revenueLogs.reduce((sum, l) => sum + Number(l.total_amount) + Number(l.gst_amount), 0);
    const cashRevenue = revenueLogs.filter(l => l.payment_mode === 'CASH').reduce((sum, l) => sum + Number(l.total_amount), 0);
    const digitalRevenue = revenueLogs.filter(l => ['UPI', 'CARD', 'WALLET'].includes(l.payment_mode || '')).reduce((sum, l) => sum + Number(l.total_amount), 0);

    // Vehicle counts
    const vehicleCounts = {
      total: revenueLogs.length,
      TWO_WHEELER: revenueLogs.filter(l => l.category === 'TWO_WHEELER').length,
      FOUR_WHEELER: revenueLogs.filter(l => l.category === 'FOUR_WHEELER').length,
      EV: revenueLogs.filter(l => l.category === 'EV').length
    };

    // Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const totalExpenses = expenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + Number(e.amount), 0);

    // Staff attendance
    const attendance = await prisma.attendance.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } }
    });

    res.json({
      date: targetDate.toISOString().split('T')[0],
      revenue: { total: totalRevenue, cash: cashRevenue, digital: digitalRevenue },
      vehicleCounts,
      expenses: { total: totalExpenses, count: expenses.length },
      staffAttendance: {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'PRESENT').length,
        absent: attendance.filter(a => a.status === 'ABSENT').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

router.get('/monthly', authenticate, async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.query;
    const monthNum = parseInt(month as string) || new Date().getMonth() + 1;
    const yearNum = parseInt(year as string) || new Date().getFullYear();

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Revenue
    const revenueLogs = await prisma.vehicleLog.findMany({
      where: {
        entry_time: { gte: startDate, lte: endDate },
        payment_status: 'PAID'
      }
    });

    const totalRevenue = revenueLogs.reduce((sum, l) => sum + Number(l.total_amount) + Number(l.gst_amount), 0);

    // Expenses by category
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: 'APPROVED'
      }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expensesByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    // Pass payments
    const passPayments = await prisma.passPayment.findMany({
      where: {
        payment_date: { gte: startDate, lte: endDate }
      }
    });

    const passRevenue = passPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Profit calculation
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

    res.json({
      month: monthNum,
      year: yearNum,
      revenue: { total: totalRevenue, parking: totalRevenue - passRevenue, passes: passRevenue },
      expenses: { total: totalExpenses, byCategory: expensesByCategory },
      profit,
      margin,
      vehicleStats: {
        total: revenueLogs.length,
        avgPerDay: Math.round(revenueLogs.length / endDate.getDate())
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

router.get('/date-range', authenticate, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date, type } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({ error: 'start_date and end_date are required' });
      return;
    }

    const start = new Date(start_date as string);
    const end = new Date(end_date as string);
    end.setHours(23, 59, 59, 999);

    if (type === 'expenses') {
      const expenses = await prisma.expense.findMany({
        where: {
          date: { gte: start, lte: end },
          status: 'APPROVED'
        },
        include: {
          vendor: true,
          created_by_user: { select: { name: true } }
        },
        orderBy: { date: 'desc' }
      });

      res.json(expenses);
    } else if (type === 'revenue') {
      const logs = await prisma.vehicleLog.findMany({
        where: {
          entry_time: { gte: start, lte: end },
          payment_status: 'PAID'
        },
        include: { slot: { include: { zone: true } } },
        orderBy: { entry_time: 'desc' }
      });

      res.json(logs);
    } else {
      res.status(400).json({ error: 'Invalid type. Use "expenses" or "revenue"' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

export default router;
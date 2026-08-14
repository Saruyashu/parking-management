import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's revenue
    const todayLogs = await prisma.vehicleLog.findMany({
      where: {
        entry_time: { gte: today, lt: tomorrow },
        payment_status: 'PAID'
      }
    });

    const todayRevenue = todayLogs.reduce((sum, l) => sum + Number(l.total_amount) + Number(l.gst_amount), 0);

    // Yesterday's revenue for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayLogs = await prisma.vehicleLog.findMany({
      where: {
        entry_time: { gte: yesterday, lte: yesterdayEnd },
        payment_status: 'PAID'
      }
    });

    const yesterdayRevenue = yesterdayLogs.reduce((sum, l) => sum + Number(l.total_amount) + Number(l.gst_amount), 0);
    const revenueChange = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

    // Active vehicles
    const activeVehicles = await prisma.vehicleLog.count({
      where: { exit_time: null }
    });

    // Total slots
    const totalSlots = await prisma.slot.count();
    const occupancyPercent = totalSlots > 0 ? Math.round((activeVehicles / totalSlots) * 100) : 0;

    // Pending approvals
    const pendingExpenses = await prisma.expense.count({
      where: { status: 'PENDING' }
    });

    // Monthly revenue and expenses
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthLogs = await prisma.vehicleLog.findMany({
      where: {
        entry_time: { gte: monthStart, lte: monthEnd },
        payment_status: 'PAID'
      }
    });

    const monthRevenue = monthLogs.reduce((sum, l) => sum + Number(l.total_amount) + Number(l.gst_amount), 0);

    const monthExpenses = await prisma.expense.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        status: 'APPROVED'
      }
    });

    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const monthProfit = monthRevenue - monthExpenseTotal;
    const profitMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : '0';

    // Expiring passes (next 7 days)
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const expiringPasses = await prisma.monthlyPass.count({
      where: {
        status: 'ACTIVE',
        end_date: { lte: in7Days }
      }
    });

    res.json({
      today: {
        revenue: todayRevenue,
        revenueChange,
        activeVehicles,
        pendingExpenses
      },
      month: {
        revenue: monthRevenue,
        expenses: monthExpenseTotal,
        profit: monthProfit,
        margin: profitMargin
      },
      occupancy: {
        current: activeVehicles,
        total: totalSlots,
        percent: occupancyPercent
      },
      alerts: {
        expiringPasses
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

router.get('/recent-activity', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [recentExpenses, recentVehicles] = await Promise.all([
      prisma.expense.findMany({
        where: { created_at: { gte: today } },
        include: { created_by_user: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 5
      }),
      prisma.vehicleLog.findMany({
        where: { entry_time: { gte: today } },
        include: { slot: true },
        orderBy: { entry_time: 'desc' },
        take: 5
      })
    ]);

    const activities = [
      ...recentExpenses.map(e => ({
        id: e.id,
        type: 'expense',
        title: e.description || e.category,
        subtitle: e.created_by_user.name,
        amount: Number(e.amount),
        status: e.status,
        time: e.created_at
      })),
      ...recentVehicles.map(v => ({
        id: v.id,
        type: 'vehicle',
        title: v.vehicle_number,
        subtitle: `${v.slot.slot_number} · ${v.category}`,
        amount: Number(v.total_amount),
        status: v.payment_status,
        time: v.entry_time
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

router.get('/trend', authenticate, async (req: AuthRequest, res) => {
  try {
    const days = Math.min(Math.max(parseInt(String(req.query.days || '30')), 1), 90);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await prisma.vehicleLog.findMany({
      where: {
        entry_time: { gte: new Date(today.getTime() - (days - 1) * 86400000) },
        payment_status: 'PAID'
      },
      select: { entry_time: true, total_amount: true, gst_amount: true }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: new Date(today.getTime() - (days - 1) * 86400000) },
        status: 'APPROVED'
      },
      select: { date: true, amount: true }
    });

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => new Date(l.entry_time).toISOString().split('T')[0] === key);
      const dayExpenses = expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === key);
      const revenue = dayLogs.reduce((s, l) => s + Number(l.total_amount) + Number(l.gst_amount), 0);
      const expenseTotal = dayExpenses.reduce((s, e) => s + Number(e.amount), 0);
      data.push({
        date: key,
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue,
        expenses: expenseTotal
      });
    }

    res.json({ days, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

export default router;
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchExpenses, approveExpense, flagExpense, fetchPendingExpenses, createExpense } from '../store/slices/expensesSlice';
import api from '../services/api';
import { formatIndianNumber } from '../components/MetricCard';
import { Plus, X } from 'lucide-react';

const categoryColors: Record<string, string> = {
  STAFF_WAGES: '#7B68EE',
  UTILITIES: '#4ECDC4',
  MAINTENANCE: '#F7B731',
  SECURITY: '#5A8FBF',
  RENT_LEASE: '#A29BFE',
  EQUIPMENT: '#E17055',
  VENDOR: '#FD79A8',
  TAX_LICENSE: '#00B894',
  SOFTWARE: '#636E72',
  INSURANCE: '#FDCB6E',
  MISCELLANEOUS: '#B2BEC3',
};

const categoryLabels: Record<string, string> = {
  STAFF_WAGES: 'Staff Wages',
  UTILITIES: 'Utilities',
  MAINTENANCE: 'Maintenance',
  SECURITY: 'Security',
  RENT_LEASE: 'Rent & Lease',
  EQUIPMENT: 'Equipment',
  VENDOR: 'Vendor',
  TAX_LICENSE: 'Tax & License',
  SOFTWARE: 'Software',
  INSURANCE: 'Insurance',
  MISCELLANEOUS: 'Miscellaneous',
};

const filters = ['All', 'STAFF_WAGES', 'UTILITIES', 'MAINTENANCE', 'SECURITY', 'RENT_LEASE', 'VENDOR'];

export const ExpensesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { expenses, summary, isLoading } = useSelector((state: RootState) => state.expenses);
  const [activeFilter, setActiveFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFlagModal, setShowFlagModal] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'MAINTENANCE',
    sub_category: '',
    vendor_id: '',
    amount: '',
    payment_mode: 'UPI',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchPendingExpenses());
    api.get('/vendors').then((res) => setVendors(res.data || [])).catch(() => setVendors([]));
  }, [dispatch]);

  const filteredExpenses = expenses.filter((e: any) => {
    const categoryMatch = activeFilter === 'All' || e.category === activeFilter;
    const statusMatch = statusFilter === 'All' || e.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  const handleApprove = (id: string) => {
    dispatch(approveExpense(id));
  };

  const handleFlag = () => {
    if (showFlagModal && flagReason) {
      dispatch(flagExpense({ id: showFlagModal, reason: flagReason }));
      setShowFlagModal(null);
      setFlagReason('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge-approved">Approved</span>;
      case 'PENDING':
        return <span className="badge-pending">Pending</span>;
      case 'FLAGGED':
        return <span className="badge-flagged">Flagged</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const handleCreate = () => {
    const amount = parseInt(newExpense.amount);
    if (!amount || amount <= 0) return;
    dispatch(createExpense({
      date: newExpense.date,
      category: newExpense.category,
      sub_category: newExpense.sub_category || undefined,
      vendor_id: newExpense.vendor_id || undefined,
      amount,
      payment_mode: newExpense.payment_mode,
      description: newExpense.description || undefined,
    })).then(() => {
      setShowCreateModal(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: 'MAINTENANCE',
        sub_category: '',
        vendor_id: '',
        amount: '',
        payment_mode: 'UPI',
        description: '',
      });
      dispatch(fetchExpenses());
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-xs rounded-full border transition-colors duration-150 ${
                activeFilter === filter
                  ? 'bg-brass border-brass text-ink'
                  : 'bg-transparent border-ink-border text-text-tertiary hover:text-text-primary'
              }`}
            >
              {filter === 'All' ? 'All' : categoryLabels[filter]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-sm py-1.5"
          >
            <option value="All">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="FLAGGED">Flagged</option>
          </select>
          <div className="text-sm text-text-secondary">
            Total: <span className="font-mono text-text-primary">₹{formatIndianNumber(summary.total)}</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus size={15} />
            Add Expense
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-border">
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                Date
              </th>
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                Category
              </th>
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                Description
              </th>
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                Vendor
              </th>
              <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                Amount
              </th>
              <th className="text-center px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                Status
              </th>
              <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense: any) => (
              <tr key={expense.id} className="table-row-hover border-b border-ink-border last:border-0">
                <td className="px-6 py-3.5 text-sm font-mono text-text-secondary">
                  {new Date(expense.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColors[expense.category] || '#636E72' }}
                    />
                    <span className="text-sm text-text-primary">
                      {categoryLabels[expense.category] || expense.category}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-primary">
                  {expense.description || '—'}
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {expense.vendor?.business_name || '—'}
                </td>
                <td className="px-6 py-3.5 text-right text-sm font-mono text-text-primary">
                  ₹{formatIndianNumber(expense.amount)}
                </td>
                <td className="px-6 py-3.5 text-center">
                  {getStatusBadge(expense.status)}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex justify-end gap-2">
                    {expense.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setShowFlagModal(expense.id)}
                          className="text-xs text-danger hover:opacity-80 transition-opacity duration-150"
                        >
                          Flag
                        </button>
                        <button
                          onClick={() => handleApprove(expense.id)}
                          className="px-3 py-1 text-xs rounded-md bg-success text-ink font-medium hover:opacity-90 transition-opacity duration-150"
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-text-primary font-display text-lg">No expenses found</p>
            <p className="text-text-tertiary text-sm mt-1">Adjust your filters or log a new expense</p>
          </div>
        )}
      </div>

      {showFlagModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-ink-elevated border border-ink-active rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-text-primary mb-4">Flag Expense</h3>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Reason for flagging..."
              className="input w-full h-24 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFlagModal(null)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                className="px-6 py-3 rounded-lg bg-danger text-ink text-sm font-medium"
              >
                Flag Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-ink-elevated border border-ink-active rounded-lg p-6 w-[480px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-text-primary">Add Expense</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-tertiary hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-tertiary block mb-2">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="input w-full"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Sub-category</label>
                <input
                  value={newExpense.sub_category}
                  onChange={(e) => setNewExpense({ ...newExpense, sub_category: e.target.value })}
                  placeholder="e.g. Gate motor repair"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0"
                  className="input w-full font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Vendor</label>
                <select
                  value={newExpense.vendor_id}
                  onChange={(e) => setNewExpense({ ...newExpense, vendor_id: e.target.value })}
                  className="input w-full"
                >
                  <option value="">— None —</option>
                  {vendors.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.business_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setNewExpense({ ...newExpense, payment_mode: mode })}
                      className={`px-3 py-2 rounded-md text-sm border text-left transition-colors duration-150 ${
                        newExpense.payment_mode === mode
                          ? 'border-brass bg-brass/12 text-brass'
                          : 'border-ink-active text-text-secondary hover:border-brass/50'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Description</label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="What is this expense for?"
                  className="input w-full h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newExpense.amount || parseInt(newExpense.amount) <= 0}
                  className="btn-primary text-sm disabled:opacity-40"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
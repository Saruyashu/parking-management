import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchPasses, renewPass, suspendPass, fetchExpiringPasses, createPass } from '../store/slices/customersSlice';
import api from '../services/api';
import { formatIndianNumber } from '../components/MetricCard';
import { UpiQrModal } from '../components/UpiQrModal';
import { Plus, X, QrCode } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { passes, expiringPasses } = useSelector((state: RootState) => state.customers);
  const [activeFilter, setActiveFilter] = useState('ACTIVE');
  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [newPass, setNewPass] = useState({
    customer_id: '',
    slot_id: '',
    pass_type: 'INDIVIDUAL',
    vehicle_number: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    amount: '',
  });
  const [upiModal, setUpiModal] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{ upi_id: string; payee_name: string } | null>(null);

  useEffect(() => {
    api.get('/settings/payment').then((res) => setPaymentSettings(res.data)).catch(() => setPaymentSettings(null));
  }, []);

  useEffect(() => {
    dispatch(fetchPasses(activeFilter));
    dispatch(fetchExpiringPasses());
  }, [dispatch, activeFilter]);

  useEffect(() => {
    if (showCreate) {
      api.get('/customers/people').then((res) => setCustomers(res.data || [])).catch(() => setCustomers([]));
      api.get('/slots', { params: { status: 'AVAILABLE' } }).then((res) => {
        const available = (res.data.slots || []).filter((s: any) => !s.is_reserved);
        setSlots(available);
      }).catch(() => setSlots([]));
    }
  }, [showCreate]);

  const handleCreate = () => {
    const amount = parseInt(newPass.amount);
    if (!newPass.customer_id || !newPass.slot_id || !newPass.vehicle_number || !newPass.end_date || !amount) return;
    dispatch(createPass({
      customer_id: newPass.customer_id,
      slot_id: newPass.slot_id,
      pass_type: newPass.pass_type,
      vehicle_number: newPass.vehicle_number,
      start_date: newPass.start_date,
      end_date: newPass.end_date,
      amount,
    })).then(() => {
      setShowCreate(false);
      dispatch(fetchPasses(activeFilter));
    });
  };

  const getPassStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge-paid">Active</span>;
      case 'EXPIRED':
        return <span className="badge-flagged">Expired</span>;
      case 'SUSPENDED':
        return <span className="badge-pending">Suspended</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const daysUntilExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleRenew = (id: string) => {
    const newEnd = new Date();
    newEnd.setMonth(newEnd.getMonth() + 1);
    dispatch(renewPass({
      id,
      new_end_date: newEnd.toISOString(),
      amount: 300000,
    }));
  };

  const handleSuspend = (id: string) => {
    dispatch(suspendPass(id));
  };

  return (
    <div className="space-y-6">
      {expiringPasses.length > 0 && (
        <div className="bg-ink-surface border border-warning/25 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-1 h-8 rounded bg-warning" />
            <div>
              <p className="text-sm text-text-primary font-medium">
                {expiringPasses.length} pass(es) expiring within 7 days
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {expiringPasses.map((p: any) => p.customer.name).join(', ')}
              </p>
            </div>
          </div>
          <button className="text-sm text-brass hover:opacity-80 transition-opacity duration-150">
            View renewals
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {['ACTIVE', 'EXPIRED', 'SUSPENDED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-xs rounded-md transition-colors duration-150 ${
                activeFilter === filter
                  ? 'bg-brass text-ink'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} />
          Issue New Pass
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {passes.map((pass: any) => {
          const daysLeft = daysUntilExpiry(pass.end_date);
          const isExpiring = daysLeft >= 0 && daysLeft <= 7;
          const isExpired = daysLeft < 0;

          return (
            <div
              key={pass.id}
              className={`card ${isExpiring ? 'border-warning/40' : ''} ${
                isExpired ? 'border-danger/25 opacity-70' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-text-primary">{pass.customer.name}</h3>
                  <p className="text-xs text-text-tertiary mt-1">{pass.customer.phone}</p>
                </div>
                {getPassStatus(pass.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-tertiary">Vehicle</span>
                  <span className="font-mono text-text-primary">{pass.vehicle_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-tertiary">Slot</span>
                  <span className="font-mono text-text-primary">{pass.slot?.slot_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-tertiary">Type</span>
                  <span className="text-text-primary">{pass.pass_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-tertiary">Ends</span>
                  <span className="font-mono text-text-primary">
                    {new Date(pass.end_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {isExpiring && (
                      <span className="ml-2 text-warning text-xs">{daysLeft}d left</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-tertiary">Amount</span>
                  <span className="font-mono text-text-primary">
                    ₹{formatIndianNumber(pass.total)}
                  </span>
                </div>
              </div>

              {pass.status === 'ACTIVE' && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleSuspend(pass.id)}
                    className="px-3 py-1.5 text-xs rounded-md text-danger hover:bg-danger/10 transition-colors duration-150"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => handleRenew(pass.id)}
                    className="px-3 py-1.5 text-xs rounded-md bg-success text-ink font-medium hover:opacity-90 transition-opacity duration-150"
                  >
                    Renew
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {passes.length === 0 && (
        <div className="card py-16 text-center">
          <p className="font-display text-lg text-text-primary">No monthly passes</p>
          <p className="text-sm text-text-tertiary mt-1">
            No {activeFilter.toLowerCase()} passes found
          </p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-ink-elevated border border-ink-active rounded-lg p-6 w-[480px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-text-primary">Issue New Monthly Pass</h3>
              <button onClick={() => setShowCreate(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-tertiary block mb-2">Customer</label>
                <select
                  value={newPass.customer_id}
                  onChange={(e) => setNewPass({ ...newPass, customer_id: e.target.value })}
                  className="input w-full"
                >
                  <option value="">— Select customer —</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Vehicle Number</label>
                <input
                  value={newPass.vehicle_number}
                  onChange={(e) => setNewPass({ ...newPass, vehicle_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. MH01AB1234"
                  className="input w-full font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Pass Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['INDIVIDUAL', 'FAMILY', 'CORPORATE'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewPass({ ...newPass, pass_type: type })}
                      className={`px-3 py-2 rounded-md text-sm border text-center transition-colors duration-150 ${
                        newPass.pass_type === type
                          ? 'border-brass bg-brass/12 text-brass'
                          : 'border-ink-active text-text-secondary hover:border-brass/50'
                      }`}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Allot Slot ({slots.length} free)</label>
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                  {slots.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setNewPass({ ...newPass, slot_id: s.id })}
                      className={`py-2 rounded-md text-sm font-mono border transition-colors duration-150 ${
                        newPass.slot_id === s.id
                          ? 'border-brass bg-brass text-ink'
                          : 'border-ink-active text-text-secondary hover:border-brass/50'
                      }`}
                    >
                      {s.slot_number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-tertiary block mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newPass.start_date}
                    onChange={(e) => setNewPass({ ...newPass, start_date: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-tertiary block mb-2">End Date</label>
                  <input
                    type="date"
                    value={newPass.end_date}
                    onChange={(e) => setNewPass({ ...newPass, end_date: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Amount (₹, before GST)</label>
                <input
                  type="number"
                  value={newPass.amount}
                  onChange={(e) => setNewPass({ ...newPass, amount: e.target.value })}
                  placeholder="3000"
                  className="input w-full font-mono"
                />
                {newPass.amount && (
                  <p className="text-xs text-text-tertiary mt-1">
                    Total with 18% GST: ₹{formatIndianNumber(Math.round(parseInt(newPass.amount) * 1.18))}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => setUpiModal(true)}
                  disabled={!newPass.customer_id || !newPass.slot_id || !newPass.vehicle_number || !newPass.end_date || !newPass.amount || !paymentSettings?.upi_id}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40"
                >
                  <QrCode size={14} />
                  Collect via UPI QR
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newPass.customer_id || !newPass.slot_id || !newPass.vehicle_number || !newPass.end_date || !newPass.amount}
                  className="btn-secondary text-sm disabled:opacity-40"
                >
                  Cash / Issue Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {upiModal && paymentSettings?.upi_id && (
        <UpiQrModal
          upiId={paymentSettings.upi_id}
          payeeName={paymentSettings.payee_name}
          amount={Math.round((parseInt(newPass.amount) || 0) * 1.18)}
          note={`Monthly pass ${newPass.vehicle_number}`}
          onClose={() => setUpiModal(false)}
          onConfirmed={handleCreate}
        />
      )}
    </div>
  );
};
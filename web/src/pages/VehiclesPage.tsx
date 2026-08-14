import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchActiveVehicles,
  createVehicleEntry,
  processVehicleExit,
} from '../store/slices/vehiclesSlice';
import * as apiService from '../services/api';
import { formatIndianNumber } from '../components/MetricCard';
import { UpiQrModal } from '../components/UpiQrModal';
import { Car, LogIn, LogOut, X, QrCode } from 'lucide-react';

const categoryColors: Record<string, { text: string; bg: string }> = {
  FOUR_WHEELER: { text: 'text-brass', bg: 'bg-brass/12' },
  TWO_WHEELER: { text: 'text-info', bg: 'bg-info/12' },
  EV: { text: 'text-success', bg: 'bg-success/12' },
  HANDICAPPED: { text: 'text-warning', bg: 'bg-warning/12' },
};

const categoryLabels: Record<string, string> = {
  FOUR_WHEELER: '4-Wheeler',
  TWO_WHEELER: '2-Wheeler',
  EV: 'EV',
  HANDICAPPED: 'Handicapped',
  PREMIUM: 'Premium',
};

export const VehiclesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeVehicles, isLoading } = useSelector((state: RootState) => state.vehicles);
  const [slots, setSlots] = useState<any[]>([]);
  const [showEntry, setShowEntry] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [selectedExit, setSelectedExit] = useState<any>(null);
  const [entry, setEntry] = useState({
    vehicle_number: '',
    category: 'FOUR_WHEELER',
    slot_id: '',
  });
  const [upiModal, setUpiModal] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{ upi_id: string; payee_name: string } | null>(null);

  useEffect(() => {
    dispatch(fetchActiveVehicles());
    fetchSlots();
    apiService
      .getPaymentSettings()
      .then(setPaymentSettings)
      .catch(() => setPaymentSettings(null));
  }, [dispatch]);

  const fetchSlots = async () => {
    try {
      const res = await apiService.getSlots();
      setSlots(res.slots || []);
    } catch {
      setSlots([]);
    }
  };

  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE' && !s.is_reserved);
  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED');
  const vehicles = activeVehicles?.vehicles || [];

  const handleEntry = () => {
    if (!entry.vehicle_number || !entry.slot_id) return;
    dispatch(createVehicleEntry(entry)).then(() => {
      setShowEntry(false);
      setEntry({ vehicle_number: '', category: 'FOUR_WHEELER', slot_id: '' });
      dispatch(fetchActiveVehicles());
      fetchSlots();
    });
  };

  const openExit = (vehicle: any) => {
    setSelectedExit(vehicle);
    setShowExit(true);
  };

  const handleExit = (payment_mode: string) => {
    if (!selectedExit) return;
    dispatch(processVehicleExit({ id: selectedExit.id, payment_mode })).then(() => {
      setShowExit(false);
      setSelectedExit(null);
      dispatch(fetchActiveVehicles());
      fetchSlots();
    });
  };

  const entryDuration = (entryTime: string) => {
    const mins = Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Live Vehicle Tracking</h3>
        <button
          onClick={() => setShowEntry(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <LogIn size={16} />
          Vehicle Entry
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card">
          <div className="kpi-label">Occupied</div>
          <div className="kpi-value text-brass">
            {occupiedSlots.length}
            <span className="text-base text-text-tertiary font-sans ml-2">
              / {slots.length}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Available</div>
          <div className="kpi-value text-success">{availableSlots.length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Active Vehicles</div>
          <div className="kpi-value">{vehicles.length}</div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-ink-border">
          <h3 className="section-title">Vehicles In Lot</h3>
        </div>
        {isLoading && vehicles.length === 0 ? (
          <div className="p-12 text-center text-text-tertiary text-sm">Loading…</div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center text-text-tertiary text-sm">
            No vehicles currently parked
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-border">
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Vehicle</th>
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Slot</th>
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Category</th>
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Duration</th>
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Rate</th>
                <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v: any) => {
                const colors = categoryColors[v.category] || categoryColors.FOUR_WHEELER;
                return (
                  <tr key={v.id} className="table-row-hover border-b border-ink-border last:border-0">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brass/20 flex items-center justify-center">
                          <Car size={16} className="text-brass" />
                        </div>
                        <div>
                          <p className="text-sm font-mono text-text-primary">{v.vehicle_number}</p>
                          <p className="text-xs text-text-tertiary">Ticket {v.ticket_id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono text-text-secondary">
                      {v.slot?.slot_number}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {categoryLabels[v.category] || v.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono text-text-primary">
                      {entryDuration(v.entry_time)}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono text-text-primary">
                      ₹{formatIndianNumber(v.rate_applied)}/hr
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => openExit(v)}
                        className="px-3 py-1.5 text-xs rounded-md bg-brass text-ink font-medium flex items-center gap-1.5 ml-auto hover:opacity-90 transition-opacity duration-150"
                      >
                        <LogOut size={13} />
                        Checkout
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showEntry && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="card w-full max-w-lg m-4 bg-ink-elevated">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base text-text-primary font-medium">Vehicle Entry</h3>
              <button onClick={() => setShowEntry(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-tertiary block mb-2">Vehicle Number</label>
                <input
                  className="input font-mono uppercase"
                  placeholder="e.g. MH01AB1234"
                  value={entry.vehicle_number}
                  onChange={(e) => setEntry({ ...entry, vehicle_number: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setEntry({ ...entry, category: key, slot_id: '' })}
                      className={`px-4 py-2.5 rounded-md text-sm border text-left transition-colors duration-150 ${
                        entry.category === key
                          ? 'border-brass bg-brass/12 text-brass'
                          : 'border-ink-active text-text-secondary hover:border-brass/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-text-tertiary block mb-2">
                  Select Slot ({availableSlots.filter((s) => s.category === entry.category).length} available)
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                  {availableSlots
                    .filter((s) => s.category === entry.category)
                    .map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setEntry({ ...entry, slot_id: s.id })}
                        className={`py-2 rounded-md text-sm font-mono border transition-colors duration-150 ${
                          entry.slot_id === s.id
                            ? 'border-brass bg-brass text-ink'
                            : 'border-ink-active text-text-secondary hover:border-brass/50'
                        }`}
                      >
                        {s.slot_number}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEntry(false)} className="btn-secondary text-sm flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleEntry}
                  disabled={!entry.vehicle_number || !entry.slot_id}
                  className="btn-primary text-sm flex-1 disabled:opacity-40"
                >
                  Log Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExit && selectedExit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="card w-full max-w-md m-4 bg-ink-elevated">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base text-text-primary font-medium">Process Checkout</h3>
              <button onClick={() => setShowExit(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Vehicle</span>
                <span className="font-mono text-text-primary">{selectedExit.vehicle_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Slot</span>
                <span className="font-mono text-text-primary">{selectedExit.slot?.slot_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Parked For</span>
                <span className="font-mono text-text-primary">{entryDuration(selectedExit.entry_time)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-tertiary block">Payment Mode</label>
              <button
                onClick={() => setUpiModal(true)}
                disabled={!paymentSettings?.upi_id}
                className="w-full px-4 py-3 rounded-md bg-brass/12 text-brass text-sm font-medium flex items-center justify-center gap-2 hover:bg-brass hover:text-ink transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <QrCode size={16} />
                {paymentSettings?.upi_id ? 'Pay via UPI QR' : 'UPI not configured (Settings → Payment)'}
              </button>
              {['CASH', 'CARD'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleExit(mode)}
                  className="w-full px-4 py-3 rounded-md bg-brass/12 text-brass text-sm font-medium hover:bg-brass hover:text-ink transition-colors duration-150"
                >
                  Collect via {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {upiModal && selectedExit && paymentSettings?.upi_id && (
        <UpiQrModal
          upiId={paymentSettings.upi_id}
          payeeName={paymentSettings.payee_name}
          amount={selectedExit.total_amount + selectedExit.gst_amount}
          note={`Parking ${selectedExit.vehicle_number}`}
          onClose={() => setUpiModal(false)}
          onConfirmed={() => {
            handleExit('UPI');
          }}
        />
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import api from '../services/api';

export const SettingsPage: React.FC = () => {
  const [pricing, setPricing] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pricing' | 'business' | 'payment' | 'account'>('pricing');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState({ upi_id: '', payee_name: '', gstin: '' });

  useEffect(() => {
    if (activeTab === 'pricing') {
      api
        .get('/slots/pricing')
        .then((res) => setPricing(res.data?.pricing || []))
        .catch(() => setPricing([]));
    }
    if (activeTab === 'payment') {
      api
        .get('/settings/payment')
        .then((res) =>
          setPayment({
            upi_id: res.data?.upi_id || '',
            payee_name: res.data?.payee_name || '',
            gstin: res.data?.gstin || '',
          })
        )
        .catch(() => {});
    }
  }, [activeTab]);

  const notify = () => {
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      for (const rule of pricing) {
        await api.patch(`/slots/pricing/${rule.id}`, {
          hourly_rate: rule.hourly_rate,
          daily_rate: rule.daily_rate,
          monthly_rate: rule.monthly_rate,
          corporate_rate: rule.corporate_rate,
        });
      }
      notify();
    } catch (e) {
      setError('Failed to save pricing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateRate = (index: number, field: string, value: string) => {
    const next = [...pricing];
    next[index] = { ...next[index], [field]: Math.max(parseInt(value) || 0, 0) * 100 };
    setPricing(next);
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/payment', payment);
      notify();
    } catch {
      setError('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Settings</h3>
        {saved && <span className="text-xs text-success">Saved</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      <div className="flex gap-1 border-b border-ink-border pb-px">
        {(['pricing', 'business', 'payment', 'account'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm capitalize transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-brass border-brass'
                : 'text-text-tertiary border-transparent hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'pricing' && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-ink-border">
            <h3 className="section-title">Rate Cards (per hour, ₹)</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-border">
                <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Category</th>
                <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Hourly</th>
                <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Daily</th>
                <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Monthly</th>
                <th className="text-right px-6 py-3 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-normal">Corporate</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p: any, i: number) => (
                <tr key={p.id} className="table-row-hover border-b border-ink-border last:border-0">
                  <td className="px-6 py-3.5 text-sm text-text-primary font-medium">{p.category.replace('_', ' ')}</td>
                  {['hourly_rate', 'daily_rate', 'monthly_rate', 'corporate_rate'].map((field) => (
                    <td key={field} className="px-6 py-3.5 text-right">
                      <input
                        type="number"
                        value={(p[field] / 100).toFixed(0)}
                        onChange={(e) => updateRate(i, field, e.target.value)}
                        className="input text-right font-mono text-sm py-1.5 w-28"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-ink-border flex justify-end">
            <button onClick={handleSavePricing} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Pricing'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'business' && (
        <div className="card max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-tertiary block mb-2">Business Name</label>
              <input className="input w-full" defaultValue="Andheri West Parking" />
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-2">Address</label>
              <input
                className="input w-full"
                defaultValue="Plot 12, SV Road, Andheri West, Mumbai 400058"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-tertiary block mb-2">GSTIN</label>
                <input className="input w-full font-mono" defaultValue="27ABCDE1234F1Z5" />
              </div>
              <div>
                <label className="text-xs text-text-tertiary block mb-2">GST Rate %</label>
                <input className="input w-full" defaultValue="18" />
              </div>
            </div>
            <div className="pt-2">
              <button onClick={notify} className="btn-primary text-sm">
                Save Business Info
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="card max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-tertiary block mb-2">UPI ID (VPA)</label>
              <input
                className="input w-full font-mono"
                placeholder="e.g. andheriwest@okbank"
                value={payment.upi_id}
                onChange={(e) => setPayment({ ...payment, upi_id: e.target.value })}
              />
              <p className="text-xs text-text-tertiary mt-1">
                Customers scan the generated QR to pay via any UPI app.
              </p>
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-2">Payee Name</label>
              <input
                className="input w-full"
                placeholder="e.g. Andheri West Parking"
                value={payment.payee_name}
                onChange={(e) => setPayment({ ...payment, payee_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-2">GSTIN</label>
              <input
                className="input w-full font-mono"
                value={payment.gstin}
                onChange={(e) => setPayment({ ...payment, gstin: e.target.value })}
              />
            </div>
            <div className="pt-2">
              <button onClick={handleSavePayment} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Payment Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="card max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-tertiary block mb-2">Name</label>
              <input className="input w-full" defaultValue="Rajesh Sharma" />
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-2">Email</label>
              <input className="input w-full" defaultValue="owner@example.com" />
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-2">Phone</label>
              <input className="input w-full" defaultValue="+91 98765 43210" />
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-2">Change Password</label>
              <input type="password" className="input w-full" placeholder="New password" />
            </div>
            <div className="pt-2">
              <button onClick={notify} className="btn-primary text-sm">
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

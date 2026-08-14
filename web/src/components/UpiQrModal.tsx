import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check } from 'lucide-react';
import { buildUpiString } from '../utils/upi';
import { formatIndianNumber } from './MetricCard';

interface UpiQrModalProps {
  upiId: string;
  payeeName: string;
  amount: number; // in paise
  note?: string;
  onClose: () => void;
  onConfirmed?: () => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({ upiId, payeeName, amount, note, onClose, onConfirmed }) => {
  const [copied, setCopied] = React.useState(false);
  const upiString = buildUpiString({ upi_id: upiId, payee_name: payeeName, amount, note });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(upiString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-ink-elevated border border-ink-active rounded-lg p-6 w-[380px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-text-primary">Pay via UPI</h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={upiString} size={200} bgColor="#FFFFFF" fgColor="#000000" />
          </div>

          <p className="text-sm text-text-primary mt-4 font-mono">₹{formatIndianNumber(amount)}</p>
          <p className="text-xs text-text-tertiary mt-1">{note || 'Scan to pay'}</p>
          <p className="text-xs text-text-tertiary mt-2 font-mono">{upiId}</p>
        </div>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-ink-active text-sm text-text-secondary hover:text-text-primary hover:border-brass/50 transition-colors duration-150"
        >
          {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy UPI ID'}
        </button>

        {onConfirmed && (
          <button
            onClick={onConfirmed}
            className="w-full mt-3 px-4 py-3 rounded-lg bg-success text-ink text-sm font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Payment Received
          </button>
        )}
      </div>
    </div>
  );
};

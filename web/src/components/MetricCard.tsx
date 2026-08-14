import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  change?: number;
  changeLabel?: string;
}

export const formatIndianNumber = (num: number): string => {
  const str = Math.round(num).toString();
  if (str.length <= 3) return str;
  let result = str.slice(-3);
  let remaining = str.slice(0, -3);
  while (remaining.length > 2) {
    result = remaining.slice(-2) + ',' + result;
    remaining = remaining.slice(0, -2);
  }
  return remaining + ',' + result;
};

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, prefix = '₹', change, changeLabel }) => {
  const displayValue = prefix === '₹' ? formatIndianNumber(value) : value.toString();

  return (
    <div className="bg-ink-surface border border-ink-border rounded-lg p-6">
      <p className="kpi-label">{label}</p>
      <div className="mt-2 flex items-baseline">
        {prefix === '₹' && <span className="text-lg text-text-primary mr-1">{prefix}</span>}
        <span className="kpi-value">{displayValue}</span>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {change >= 0 ? '▲' : '▼'}
          </span>
          <span className={`text-xs ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {Math.abs(change)}% {changeLabel || 'vs yesterday'}
          </span>
        </div>
      )}
    </div>
  );
};
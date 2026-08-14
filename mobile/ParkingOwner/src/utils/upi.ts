export interface UpiPaymentParams {
  upi_id: string;
  payee_name: string;
  amount: number; // in paise
  note?: string;
}

// Build a UPI intent string that any UPI app can scan/parse
export const buildUpiString = ({ upi_id, payee_name, amount, note }: UpiPaymentParams): string => {
  const params: string[] = [
    `pa=${encodeURIComponent(upi_id)}`,
    `pn=${encodeURIComponent(payee_name)}`,
    `am=${(amount / 100).toFixed(2)}`,
    `cu=INR`,
  ];
  if (note) params.push(`tn=${encodeURIComponent(note)}`);
  return `upi://pay?${params.join('&')}`;
};

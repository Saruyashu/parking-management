export interface UpiPaymentParams {
  upi_id: string;
  payee_name: string;
  amount: number; // in paise
  note?: string;
}

// Build a UPI intent string that any UPI app can scan/parse
export const buildUpiString = ({ upi_id, payee_name, amount, note }: UpiPaymentParams): string => {
  const params = new URLSearchParams();
  params.set('pa', upi_id);
  params.set('pn', payee_name);
  params.set('am', (amount / 100).toFixed(2));
  params.set('cu', 'INR');
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
};

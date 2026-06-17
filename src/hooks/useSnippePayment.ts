import { supabase } from '../lib/supabase';
import { PaymentMethod } from '../types';

interface SnippeCheckoutConfig {
  businessId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  bookingDate: string;
  bookingTime: string;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  amount: number;
}

interface SnippeCheckoutResponse {
  bookingId: string;
  receiptNumber: string;
  transactionReference: string;
  checkoutUrl: string | null;
  status: string;
}

export async function startSnippePayment(config: SnippeCheckoutConfig) {
  const { data, error } = await supabase.functions.invoke<SnippeCheckoutResponse>(
    'snippe-checkout',
    {
      body: config,
    },
  );

  if (error) {
    const context = 'context' in error ? error.context : null;

    if (context instanceof Response) {
      const responseBody = await context.json().catch(() => null) as { error?: string; message?: string } | null;
      const message = responseBody?.error || responseBody?.message;

      if (message) {
        throw new Error(message);
      }
    }

    throw new Error(error.message || 'Payment service could not be reached');
  }

  if (!data) {
    throw new Error('Payment service returned an empty response');
  }

  return data;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PaymentMethod = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'halopesa' | 'card';

interface CheckoutRequest {
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

const snippeMethod: Record<PaymentMethod, string> = {
  mpesa: 'mobile_money.mpesa',
  airtel_money: 'mobile_money.airtel',
  tigo_pesa: 'mobile_money.tigo',
  halopesa: 'mobile_money.halopesa',
  card: 'card',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getPaymentUrl(payload: Record<string, unknown>) {
  return (
    payload.checkout_url ||
    payload.payment_url ||
    payload.redirect_url ||
    payload.url ||
    null
  );
}

// Kazi ya kusafisha namba ya simu iende kwa format ya 255
function formatTanzanianPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, ''); // Ondoa space, mabano na alama ya jumlisha
  
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('6') || cleaned.startsWith('8')) {
    cleaned = '255' + cleaned;
  }
  
  return cleaned;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let payload: CheckoutRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const {
    businessId,
    serviceId,
    customerName,
    customerPhone,
    customerEmail,
    bookingDate,
    bookingTime,
    notes,
    paymentMethod,
    amount,
  } = payload;

  if (
    !businessId ||
    !serviceId ||
    !customerName ||
    !customerPhone ||
    !bookingDate ||
    !bookingTime ||
    !paymentMethod ||
    !amount
  ) {
    return jsonResponse({ error: 'Missing required checkout details' }, 400);
  }

  const apiKey = Deno.env.get('SNIPPE_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    Deno.env.get('SUPABASE_ANON_KEY');

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: 'Payment service is not configured' }, 500);
  }

  const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || '';
  const transactionReference = `SNP-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Kusafisha namba ya simu kwa ajili ya Snippe API
  const formattedPhone = formatTanzanianPhoneNumber(customerPhone);

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      business_id: businessId,
      service_id: serviceId,
      customer_name: customerName,
      customer_phone: customerPhone, // Tunahifadhi namba asili ya mteja kwenye DB yetu
      customer_email: customerEmail || null,
      booking_date: bookingDate,
      booking_time: bookingTime,
      notes: notes || null,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'processing',
      transaction_id: transactionReference,
    })
    .select('id, receipt_number')
    .single();

  if (bookingError) {
    return jsonResponse({ error: bookingError.message }, 500);
  }

  const successUrl = `${origin}/booking/success?receipt=${booking.receipt_number}&business=${businessId}&service=${serviceId}&date=${bookingDate}&time=${bookingTime}&transaction=${transactionReference}`;
  const callbackUrl = `${supabaseUrl}/functions/v1/snippe-webhook`;
  
  // Kutatua typo zote za mwanzo za SNTPPE na SNIPPE
  const rawBaseUrl = Deno.env.get('SNIPPE_API_BASE_URL') || Deno.env.get('SNTPPE_API_BASE_URL') || 'https://api.snippe.io';
  const snippeBaseUrl = rawBaseUrl.replace(/\/$/, '');

  let snippeResponse: Response;
  try {
    snippeResponse = await fetch(`${snippeBaseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        amount,
        currency: 'TZS',
        reference: transactionReference,
        payment_method: snippeMethod[paymentMethod],
        description: 'BookEase TZ appointment booking',
        customer: {
          name: customerName,
          phone: formattedPhone, // Hapa inatumwa ile iliyosafishwa yenye 255
          email: customerEmail || undefined,
        },
        redirect_url: successUrl,
        callback_url: callbackUrl,
        metadata: {
          booking_id: booking.id,
          business_id: businessId,
          service_id: serviceId,
        },
      }),
    });
  } catch (error) {
    await supabase
      .from('bookings')
      .update({ payment_status: 'failed' })
      .eq('id', booking.id);

    console.error('Snippe connection error:', error);

    return jsonResponse(
      { error: 'Could not connect to Snippe. Check SNIPPE_API_BASE_URL and your Snippe API credentials.' },
      502,
    );
  }

  const snippeBody = await snippeResponse.json().catch(() => ({}));

  if (!snippeResponse.ok) {
    await supabase
      .from('bookings')
      .update({ payment_status: 'failed' })
      .eq('id', booking.id);

    // Hii itakusaidia kuona ujumbe halisi wa makosa kwenye Supabase Logs Dashboard
    console.error('Snippe API Error response payload:', JSON.stringify(snippeBody));

    return jsonResponse(
      {
        error:
          snippeBody.message ||
          snippeBody.error ||
          'Snippe payment initialization failed',
      },
      snippeResponse.status,
    );
  }

  const providerPayload = (snippeBody.data || snippeBody) as Record<string, unknown>;
  const checkoutUrl = getPaymentUrl(providerPayload);
  const status = String(providerPayload.status || 'processing').toLowerCase();

  if (status === 'successful' || status === 'success' || status === 'completed') {
    await supabase
      .from('bookings')
      .update({ payment_status: 'completed', status: 'confirmed' })
      .eq('id', booking.id);
  }

  return jsonResponse({
    bookingId: booking.id,
    receiptNumber: booking.receipt_number,
    transactionReference,
    checkoutUrl,
    status,
  });
});
import { createClient } from '@supabase/supabase-js';

function extractReference(payload: Record<string, unknown>) {
  const data = (payload.data || payload.payment || payload.transaction || payload) as Record<string, unknown>;

  return String(
    data.reference ||
    data.transaction_reference ||
    data.tx_ref ||
    data.external_reference ||
    '',
  );
}

function extractStatus(payload: Record<string, unknown>) {
  const data = (payload.data || payload.payment || payload.transaction || payload) as Record<string, unknown>;
  const status = String(data.status || payload.event || '').toLowerCase();

  if (['successful', 'success', 'completed', 'paid', 'payment.completed'].includes(status)) {
    return 'completed';
  }

  if (['failed', 'cancelled', 'canceled', 'expired', 'payment.failed'].includes(status)) {
    return 'failed';
  }

  return 'processing';
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const webhookSecret = Deno.env.get('SNIPPE_WEBHOOK_SECRET');
  const signature =
    req.headers.get('x-snippe-signature') ||
    req.headers.get('x-webhook-signature') ||
    req.headers.get('x-webhook-secret');

  if (webhookSecret && signature !== webhookSecret) {
    return new Response('Invalid signature', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Webhook is not configured', { status: 500 });
  }

  const payload = await req.json().catch(() => null) as Record<string, unknown> | null;

  if (!payload) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const transactionReference = extractReference(payload);
  const paymentStatus = extractStatus(payload);

  if (!transactionReference) {
    return new Response('Missing transaction reference', { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const update =
    paymentStatus === 'completed'
      ? { payment_status: paymentStatus, status: 'confirmed' }
      : { payment_status: paymentStatus };

  const { error } = await supabase
    .from('bookings')
    .update(update)
    .eq('transaction_id', transactionReference);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json({ received: true });
});

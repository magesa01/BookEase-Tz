import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    
    // Kusoma data kutoka fomu
    const { businessId, serviceId, customerName, customerPhone, customerEmail, bookingDate, bookingTime, amount } = body;

    // Anzisha Supabase Admin Client ili kuingiza data kwenye database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // MOCK DATA: Tunatengeneza reference ya majaribio
    const mockReference = "TEST-" + Math.floor(100000 + Math.random() * 900000);

    // PUSH KWENYE DATABASE: Tunaingiza data kwenye table ya bookings
    const { error: dbError } = await supabaseAdmin
      .from('bookings') 
      .insert([
        {
          business_id: businessId,
          service_id: serviceId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          booking_date: bookingDate,
          booking_time: bookingTime,
          amount: Number(amount),
          payment_status: 'mock_success', 
          transaction_reference: mockReference
        }
      ]);

    if (dbError) throw dbError;

    // RUDISHA MAJIBU: Tunarudisha success ili frontend imalizie mtiririko
    return new Response(
      JSON.stringify({ 
        success: true,
        transactionReference: mockReference,
        message: "Booking recorded successfully for testing."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
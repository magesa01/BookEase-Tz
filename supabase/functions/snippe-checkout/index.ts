import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Kushughulikia CORS preflight requests (Muhimu kwa React Frontend kuwasiliana na Edge Function)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    
    // Kusoma variables kwa usalama (Inatafuta zote mbili camelCase na snake_case kutoka React)
    const businessId = body.businessId || body.business_id;
    const serviceId = body.serviceId || body.service_id;
    const customerName = body.customerName || body.customer_name;
    const customerPhone = body.customerPhone || body.customer_phone;
    const customerEmail = body.customerEmail || body.customer_email;
    const bookingDate = body.bookingDate || body.booking_date;
    const bookingTime = body.bookingTime || body.booking_time;
    const notes = body.notes;
    const paymentMethod = body.paymentMethod || body.payment_method;
    const amount = body.amount;

    // Kagua kama vigezo vya lazima vipo
    if (!businessId || !serviceId || !customerName || !customerPhone || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required checkout parameters on backend." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Chukua API Key ya Snippe kutoka kwenye Environment Variables za Supabase
    const snippeApiKey = Deno.env.get('SNIPPE_API_KEY');
    
    if (!snippeApiKey) {
      return new Response(
        JSON.stringify({ error: "Server Configuration Error: SNIPPE_API_KEY is not set on Supabase Secrets." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Andaa payload kwenda Snippe API kulingana na muundo wao rasmi
    const snippePayload = {
      amount: Number(amount),
      currency: "TZS",
      description: `Booking for ${customerName} - Business: ${businessId}`,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined
      },
      metadata: {
        business_id: businessId,
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        notes: notes || ""
      },
      // Ziada: Unaweza kuweka callback_url au redirect_url hapa kama zipo kwenye doc za Snippe
    };

    // Tuma ombi halisi kwenda Snippe API Dashboard backend
    const snippeResponse = await fetch('https://api.snippe.io/v1/checkout', { // <-- Badilisha na endpoint rasmi ya Snippe kama ni tofauti
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${snippeApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(snippePayload)
    });

    // Kama Snippe wamekataa ombi
    if (!snippeResponse.ok) {
      const errorText = await snippeResponse.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { message: errorText };
      }
      
      return new Response(
        JSON.stringify({ error: parsedError.message || parsedError.error || "Failed to communicate with Snippe Gateway API." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: snippeResponse.status }
      );
    }

    // Mambo yakiwa safi, soma majibu kutoka Snippe
    const snippeData = await snippeResponse.json();

    // Dondoo kutoka kwenye response ya Snippe (Inaweza kuwa checkout_url, au url tu kulingana na API yao)
    const realCheckoutUrl = snippeData.checkout_url || snippeData.url || (snippeData.data?.checkoutUrl);
    const realTransactionRef = snippeData.reference || snippeData.id || snippeData.transaction_id || "REF_" + Math.random().toString(36).substr(2, 9);

    if (!realCheckoutUrl) {
      return new Response(
        JSON.stringify({ error: "Snippe API did not return a valid checkout URL." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Rudisha majibu halisi kwenda kwenye Frontend (React)
    return new Response(
      JSON.stringify({ 
        checkoutUrl: realCheckoutUrl, 
        transactionReference: realTransactionRef 
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
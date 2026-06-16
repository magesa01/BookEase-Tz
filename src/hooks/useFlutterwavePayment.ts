import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PaymentConfig {
  bookingId: string;
  amount: number;
  email: string;
  phone: string;
  name: string;
}

export function useFlutterwavePayment() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Automatically inject the Flutterwave script dynamically
  useEffect(() => {
    // Check if script is already present
    if (window.hasOwnProperty('FlutterwaveCheckout')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts if necessary
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async (config: PaymentConfig) => {
    if (!scriptLoaded) {
      alert('Payment system is still loading. Please try again in a moment.');
      return;
    }

    // 1. Log a pending payment entry in your Supabase database
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert({
        booking_id: config.bookingId,
        amount: config.amount,
        status: 'pending',
        provider: 'flutterwave',
        transaction_reference: `TXN-${config.bookingId}-${Date.now()}`
      })
      .select()
      .single();

    if (dbError) {
      alert('Payment initialization failed: ' + dbError.message);
      return;
    }

    // 2. Trigger the Flutterwave Payment Modal overlay
    // @ts-ignore
    window.FlutterwaveCheckout({
      public_key: "FLWPUBK_TEST-SANDBOX-KEY-HERE", // Replace with your Flutterwave Test Public Key
      tx_ref: paymentRecord.transaction_reference,
      amount: config.amount,
      currency: "TZS",
      payment_options: "card, mobilemoneytanzania",
      customer: {
        email: config.email || "customer@bookease.com",
        phone_number: config.phone,
        name: config.name,
      },
      customizations: {
        title: "BookEase TZ",
        description: "Payment for booked appointment service",
        logo: "https://checkout.flutterwave.com/assets/img/logo.svg",
      },
      callback: async (response: any) => {
        console.log("Payment response:", response);
        
        if (response.status === "successful" || response.status === "completed") {
          // 3. Update payment status to completed
          await supabase
            .from('payments')
            .update({ 
              status: 'completed',
              transaction_reference: response.transaction_id 
            })
            .eq('id', paymentRecord.id);

          // 4. Update the booking status check constraint column to 'confirmed'
          await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', config.bookingId);

          alert('Payment Successful! Your appointment booking has been confirmed.');
          window.location.reload();
        } else {
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('id', paymentRecord.id);
            
          alert('Payment processing was unsuccessful.');
        }
      },
      onclose: () => {
        console.log("Payment modal closed by user.");
      },
    });
  };

  return { handlePayment };
}
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type PaymentMethod = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'halopesa' | 'card';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // States za fomu
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Tunatuma data kwenye Edge Function yetu (Mock mode)
      const { data, error } = await supabase.functions.invoke('snippe-checkout', {
        body: JSON.stringify({
          fullName,
          phone,
          paymentMethod,
          amount: 10000 // Mock price
        })
      });

      if (error) console.error("Function Error:", error);

      // Tunampeleka mteja kwenye ukurasa wa mafanikio bila kujali kama API ilikubali au la
      navigate(`/booking/success?status=success&ref=${data?.transactionReference || 'TEST-MOCK-123'}`);
      
    } catch (err) {
      console.log("Mocking flow:", err);
      navigate('/booking/success?status=mock_success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Secure Checkout</h1>
      <form onSubmit={handleCheckoutSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Full Name</label>
          <input type="text" className="w-full p-3 border rounded-xl" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Weka jina lako" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Phone Number</label>
          <input type="tel" className="w-full p-3 border rounded-xl" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xxxxxxxx" />
        </div>
        <button type="submit" disabled={submitting} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl">
          {submitting ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </form>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type PaymentMethod = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'halopesa' | 'card';

interface BusinessDetails {
  id: string;
  name: string;
  location: string;
}

interface ServiceDetails {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const businessId = searchParams.get('businessId') || '';
  const serviceId = searchParams.get('serviceId') || '';
  const dateParam = searchParams.get('date') || '';
  const timeParam = searchParams.get('time') || '';

  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');

  useEffect(() => {
    async function fetchCheckoutDetails() {
      if (!businessId || !serviceId) {
        setErrorMessage('Invalid checkout session parameters.');
        setLoading(false);
        return;
      }

      try {
        // Vuta taarifa za Biashara
        const { data: bizData, error: bizErr } = await supabase
          .from('businesses')
          .select('id, name, location')
          .eq('id', businessId)
          .single();

        if (bizErr) throw bizErr;
        setBusiness(bizData);

        // Vuta taarifa za Huduma
        const { data: servData, error: servErr } = await supabase
          .from('services')
          .select('id, name, price, duration')
          .eq('id', serviceId)
          .single();

        if (servErr) throw servErr;
        setService(servData);
      } catch (err: any) {
        console.error('Error fetching checkout info:', err);
        setErrorMessage(err.message || 'Failed to load checkout details.');
      } finally {
        setLoading(false);
      }
    }

    fetchCheckoutDetails();
  }, [businessId, serviceId]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Full Name and Phone Number are required.');
      return;
    }

    if (!service) {
      setErrorMessage('Service details not loaded correctly.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Jenga Object ya payload kwenda Backend Edge Function
      const checkoutPayload = {
        businessId,
        serviceId,
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() === '' ? null : email.trim(),
        bookingDate: dateParam,
        bookingTime: timeParam,
        notes: notes.trim() === '' ? null : notes.trim(),
        paymentMethod,
        amount: service.price,
      };

      // 2. Tuma ombi kwenda kwenye Supabase Edge Function
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('snippe-checkout', {
        body: checkoutPayload,
      });

      // Ukaguzi thabiti wa makosa yanayorudishwa na Invoke
      if (sessionError) {
        let errorBody = 'Payment initialization failed.';
        try {
          // Jaribu kusoma kama kuna ujumbe wa kina wa JSON kutoka kwenye Edge function response
          const errResponse = await sessionError.context?.json();
          errorBody = errResponse?.error || errResponse?.message || errorBody;
        } catch {
          errorBody = sessionError.message || errorBody;
        }
        throw new Error(errorBody);
      }

      // 3. Kama kuna makosa yamerudishwa ndani ya data object yenyewe
      if (sessionData && (sessionData.error || sessionData.message === 'Snippe payment initialization failed')) {
        throw new Error(sessionData.error || 'Snippe API refused to initialize payment. Check logs.');
      }

      // 4. Mambo yakiwa safi, weka maelekezo ya kurasa
      if (sessionData) {
        const transactionRef = sessionData.transactionReference || sessionData.transactionId || sessionData.transaction_id;
        const checkoutUrl = sessionData.checkoutUrl;

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          const receiptNum = sessionData.receiptNumber || '';
          navigate(
            `/booking/success?receipt=${receiptNum}&business=${businessId}&service=${serviceId}&date=${dateParam}&time=${timeParam}&transaction=${transactionRef}`
          );
        }
      } else {
        throw new Error('No data returned from payment initialization.');
      }
    } catch (err: any) {
      console.error('Checkout response error:', err);
      setErrorMessage(err.message || 'Snippe payment initialization failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
      >
        ← Back to Business
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Booking Summary Section */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase block">Business</span>
              <span className="text-base font-bold text-gray-800">{business?.name || 'Loading...'}</span>
              <span className="text-sm text-gray-500 block">📍 {business?.location || ''}</span>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <span className="text-xs font-semibold text-gray-400 uppercase block">Service</span>
              <span className="text-base font-bold text-gray-800">{service?.name || 'Loading...'}</span>
              <span className="text-sm text-gray-500 block">{service?.duration || 0} min</span>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <span className="text-xs font-semibold text-gray-400 uppercase block">Date & Time</span>
              <span className="text-sm text-gray-700 block">📅 {dateParam}</span>
              <span className="text-sm text-gray-700 block">🕒 {timeParam}</span>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <span className="text-base font-medium text-gray-700">Total Price</span>
              <span className="text-xl font-extrabold text-indigo-600">
                {service ? `${service.price.toLocaleString()} TSh` : '0 TSh'}
              </span>
            </div>
          </div>
        </div>

        {/* Secure Checkout Form */}
        <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🛡️ Secure Checkout
          </h2>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-sm font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. AUGUSTINE JOHN"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 255757737713"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or details..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Select Payment Network</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(['mpesa', 'airtel_money', 'tigo_pesa', 'halopesa', 'card'] as PaymentMethod[]).map((method) => (
                  <label
                    key={method}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 ring-2 ring-indigo-600/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="sr-only"
                    />
                    <span className="text-sm font-bold capitalize">{method.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all ${
                submitting 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:bg-indigo-700 hover:shadow-xl active:scale-[0.99]'
              }`}
            >
              {submitting ? 'Initializing Payment...' : `Confirm & Pay ${service ? service.price.toLocaleString() : 0} TSh`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Calendar,
  ArrowLeft,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Business, Service, PaymentMethod, paymentMethods } from '../types';
import { startSnippePayment } from '../hooks/useSnippePayment';

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const serviceId = searchParams.get('serviceId');
  const businessId = searchParams.get('businessId');

  useEffect(() => {
    if (serviceId && businessId && date && time) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [serviceId, businessId, date, time]);

  const fetchData = async () => {
    try {
      const [businessRes, serviceRes] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', businessId).single(),
        supabase.from('services').select('*').eq('id', serviceId).single(),
      ]);

      if (businessRes.error) throw businessRes.error;
      if (serviceRes.error) throw serviceRes.error;

      setBusiness(businessRes.data);
      setService(serviceRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tz-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(price) + ' TSh';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePayment = async () => {
    if (!selectedPayment || !customerName || !customerPhone || !business || !service || !date || !time) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const payment = await startSnippePayment({
        businessId: business.id,
        serviceId: service.id,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        bookingDate: date,
        bookingTime: time,
        notes: bookingNotes || null,
        paymentMethod: selectedPayment,
        amount: Number(service.price),
      });

      if (payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }

      if (['successful', 'success', 'completed'].includes(payment.status)) {
        navigate(`/booking/success?receipt=${payment.receiptNumber}&business=${business.id}&service=${service.id}&date=${date}&time=${time}&transaction=${payment.transactionReference}`);
        return;
      }

      setError('Payment request sent. Please complete the prompt on your phone, then wait for confirmation.');
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!business || !service || !date || !time) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Booking Details</h2>
            <p className="text-gray-600 mb-6">We couldn't find your booking information.</p>
            <Link
              to="/search"
              className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
            >
              Browse Services
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to={`/business/${business.id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Business</span>
          </Link>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left - Booking Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Business</p>
                    <p className="font-medium text-gray-900">{business.name}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {business.location}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {service.duration_minutes} min
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <div className="flex items-center text-sm text-gray-900 mt-1">
                      <Calendar className="h-4 w-4 mr-1 text-teal-600" />
                      {formatDate(date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-900 mt-1">
                      <Clock className="h-4 w-4 mr-1 text-teal-600" />
                      {time}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Price</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-teal-700">Total</span>
                      <span className="text-xl font-bold text-teal-600">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Payment Form */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="h-5 w-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-gray-900">Secure Checkout</h2>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Customer Details */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Your Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                        disabled={processing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+255 XXX XXX XXX"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                        disabled={processing}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address (optional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                      disabled={processing}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Any special requests..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-none"
                      disabled={processing}
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Select Payment Method</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        disabled={processing}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                          selectedPayment === method.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center text-white font-bold text-lg`}
                        >
                          {method.logo}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-500">
                            {method.id === 'card' ? 'Visa / Mastercard' : 'Mobile Money'}
                          </p>
                        </div>
                        {selectedPayment === method.id && (
                          <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Mobile Money Instructions */}
                  {selectedPayment && selectedPayment !== 'card' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">
                            {
                              paymentMethods.find((m) => m.id === selectedPayment)
                                ?.name
                            } Payment
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            After clicking "Pay Now", you will receive a payment prompt
                            on your phone. Enter your PIN to confirm the transaction.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Payment Note */}
                  {selectedPayment === 'card' && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-purple-900">Card Payment</p>
                          <p className="text-sm text-purple-700 mt-1">
                            Secure payment processed via Snippe. Your card details are
                            encrypted and protected.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pay Button */}
                <div className="mt-8">
                  <button
                    onClick={handlePayment}
                    disabled={!selectedPayment || !customerName || !customerPhone || processing}
                    className="w-full py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        Pay {formatPrice(service.price)}
                      </>
                    )}
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    By proceeding, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>

                {/* Snippe Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Secured by Snippe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Your Payment</h3>
            <p className="text-gray-600 text-sm">
              Please wait while we securely process your transaction...
            </p>
            {selectedPayment && selectedPayment !== 'card' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Check your phone for the payment prompt from{' '}
                  {paymentMethods.find((m) => m.id === selectedPayment)?.name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

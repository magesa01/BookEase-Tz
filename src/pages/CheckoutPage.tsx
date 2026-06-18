import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const PAYPAL_BOOKING_AMOUNT = '10.00';
const PAYPAL_CURRENCY = 'USD';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [{ isPending, isRejected, isResolved }] = usePayPalScriptReducer();
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const bookingDetails = useMemo(
    () => ({
      businessId: searchParams.get('businessId') || '',
      serviceId: searchParams.get('serviceId') || '',
      date: searchParams.get('date') || '',
      time: searchParams.get('time') || '',
    }),
    [searchParams]
  );

  const hasBookingDetails = Boolean(
    bookingDetails.businessId &&
      bookingDetails.serviceId &&
      bookingDetails.date &&
      bookingDetails.time
  );

  const isFormReady = Boolean(
    fullName.trim().length > 1 &&
      phone.trim().length > 5 &&
      hasBookingDetails
  );

  const saveBookingAfterPayment = async (transactionId: string) => {
    setSubmitting(true);

    try {
      const { businessId, serviceId, date, time } = bookingDetails;

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          business_id: businessId,
          service_id: serviceId,
          customer_name: fullName.trim(),
          customer_phone: phone.trim(),
          customer_email: null,
          booking_date: date,
          booking_time: time,
          status: 'confirmed',
          payment_method: 'paypal',
          payment_status: 'completed',
          transaction_id: transactionId,
        })
        .select('receipt_number')
        .single();

      if (error) throw error;

      toast.success('Booking successful.');

      const successParams = new URLSearchParams({
        status: 'success',
        business: businessId,
        service: serviceId,
        date,
        time,
        transaction: transactionId,
      });

      if (data?.receipt_number) {
        successParams.set('receipt', data.receipt_number);
      }

      navigate(`/booking/success?${successParams.toString()}`);
    } catch (err) {
      console.error('Booking save error:', err);
      toast.error('Payment completed, but booking could not be saved. Please contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Secure Checkout</h1>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Full Name</label>
          <input
            type="text"
            className="w-full p-3 border rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Weka jina lako"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Phone Number</label>
          <input
            type="tel"
            className="w-full p-3 border rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xxxxxxxx"
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Pay with PayPal</h2>
            <p className="text-sm text-gray-600">
              Complete your secure sandbox payment to confirm this booking.
            </p>
          </div>

          {!import.meta.env.VITE_PAYPAL_CLIENT_ID && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add your PayPal Sandbox Client ID as VITE_PAYPAL_CLIENT_ID to enable sandbox checkout.
            </div>
          )}

          {!hasBookingDetails && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This checkout is missing booking details. Please select a service, date, and time from a business page first.
            </div>
          )}

          {hasBookingDetails && !isFormReady && (
            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              Enter your name and phone number to activate PayPal checkout.
            </div>
          )}

          {isPending && hasBookingDetails && isFormReady && (
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
          )}

          {isRejected && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              PayPal could not load. Check your Sandbox Client ID, restart the dev server, then refresh this page.
            </div>
          )}

          {isResolved && hasBookingDetails && (
            <PayPalButtons
              disabled={submitting || !isFormReady}
              forceReRender={[PAYPAL_BOOKING_AMOUNT, isFormReady]}
              style={{
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal',
              }}
              createOrder={(_, actions) => {
                if (!isFormReady) {
                  toast.error('Please complete your booking details before paying.');
                  throw new Error('Missing booking details');
                }

                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [
                    {
                      description: 'BookEase TZ appointment booking',
                      amount: {
                        currency_code: PAYPAL_CURRENCY,
                        value: PAYPAL_BOOKING_AMOUNT,
                      },
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                try {
                  const capture = await actions.order?.capture();
                  const transactionId =
                    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.orderID;

                  await saveBookingAfterPayment(transactionId);
                } catch (err) {
                  console.error('PayPal approval error:', err);
                  toast.error('Payment was approved, but confirmation failed. Please try again.');
                }
              }}
              onCancel={() => {
                toast.error('PayPal payment was canceled.');
              }}
              onError={(err) => {
                console.error('PayPal payment error:', err);
                toast.error('PayPal payment failed. Please try again.');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Share2,
  Home,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { Business, Service } from '../types';

export function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const receipt = searchParams.get('receipt') || `BK-${Math.floor(100000 + Math.random() * 900000)}`;
  const businessId = searchParams.get('business');
  const serviceId = searchParams.get('service');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const transaction = searchParams.get('transaction') || `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  useEffect(() => {
    if (businessId && serviceId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [businessId, serviceId]);

  const fetchData = async () => {
    try {
      // Tunahakikisha tunavuta column zote zikiwemo za jina na bei (price)
      const [businessRes, serviceRes] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', businessId).single(),
        supabase.from('services').select('*').eq('id', serviceId).single(),
      ]);

      if (businessRes.data) setBusiness(businessRes.data);
      if (serviceRes.data) setService(serviceRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
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

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Booking Confirmation - BookEase TZ',
          text: `My appointment at ${business?.name} is confirmed for ${date ? formatDate(date) : ''} at ${time}. Receipt: ${receipt}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-teal-600 font-medium">Inapakia taarifa za risiti...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-8 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce-in">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600">
              Your appointment has been successfully booked and paid.
            </p>
          </div>

          {/* Receipt Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Receipt Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">BookEase TZ</h2>
                  <p className="text-teal-100 text-sm">Booking Receipt</p>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  <span className="font-mono font-bold">{receipt}</span>
                </div>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6">
              {/* Business Info */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Service Provider</h3>
                <p className="text-xl font-bold text-gray-900">{business?.name || 'Marium Saloon'}</p>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {business?.location || 'Mwanza Buzuruga'}
                </div>
                {business?.phone && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <Phone className="h-4 w-4 mr-1" />
                    {business.phone}
                  </div>
                )}
              </div>

              {/* Booking Details */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Appointment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">{service?.name || 'Hair cut'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{service?.duration_minutes || '45'} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      <p className="font-medium text-gray-900">{date ? formatDate(date) : 'Leo'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <p className="font-medium text-gray-900">{time || '10:00 AM'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm text-gray-900">{transaction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total Paid</span>
                    <span className="text-2xl font-bold text-teal-600">
                      {service?.price ? formatPrice(service.price) : '10,000 TSh'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-sm text-gray-500">
                <p>Booking confirmed on: {getCurrentDate()}</p>
                <p className="mt-1">
                  Please arrive 10 minutes before your appointment time.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download Receipt
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="bg-teal-50 rounded-xl p-4">
              <h4 className="font-medium text-teal-800 mb-2">Need to make changes?</h4>
              <p className="text-sm text-teal-700">
                Contact {business?.name || 'the Salon'} directly to reschedule or cancel your appointment.
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">Save your receipt</h4>
              <p className="text-sm text-blue-700">
                Your receipt number is <strong>{receipt}</strong>. Keep this for your records.
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
            >
              <Home className="h-5 w-5" />
              Book Another Appointment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
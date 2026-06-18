import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Printer, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Business, Service } from '../types';

export function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // Data za Mfano/URL
  const receipt = searchParams.get('receipt') || 'BK-581786';
  const transaction = searchParams.get('transaction') || 'TX-DT33C38R5';
  const date = searchParams.get('date') || 'June 18, 2026';
  const time = searchParams.get('time') || '10:00 AM';

  // Fetching
  const businessId = searchParams.get('business');
  const serviceId = searchParams.get('service');

  useEffect(() => {
    async function fetchData() {
      try {
        const [b, s] = await Promise.all([
          supabase.from('businesses').select('*').eq('id', businessId).single(),
          supabase.from('services').select('*').eq('id', serviceId).single(),
        ]);
        if (b.data) setBusiness(b.data);
        if (s.data) setService(s.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    if (businessId) fetchData(); else setLoading(false);
  }, [businessId, serviceId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Container - Kwenye screen inajibana, kwenye Print inajitanua */}
      <div className="max-w-2xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:max-w-full">
        
        {/* Header - Imeondoa Navbar/Footer */}
        <div className="text-center border-b-2 border-dashed pb-6 mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold mt-4">Booking Confirmed!</h1>
          <p className="text-gray-500">Your appointment has been successfully booked and paid.</p>
        </div>

        {/* Content - Imejipanga kama PDF */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Service Provider</h3>
            <p className="font-bold text-xl mt-1">{business?.name || 'Marium Saloon'}</p>
            <p className="text-gray-600">{business?.location || 'Mwanza Buzuruga'}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt Number</h3>
            <p className="font-mono font-bold text-xl text-teal-700 mt-1">{receipt}</p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-3">Appointment Details</h3>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Service</span>
              <span className="font-medium">{service?.name || 'Hair cut'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Time</span>
              <span className="font-medium">{time}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-3">Payment Information</h3>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono">{transaction}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-bold text-xl text-teal-600">{service?.price || '10,000'} TSh</span>
            </div>
          </div>
        </div>

        {/* Actions - Zitafichwa wakati wa Print */}
        <div className="print:hidden flex gap-4 mt-8">
          <button 
            onClick={() => window.print()} 
            className="flex-1 bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" /> Save Receipt
          </button>
          <Link to="/" className="flex-1 bg-teal-600 text-white py-3 rounded-lg flex items-center justify-center gap-2">
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
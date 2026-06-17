import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Business } from '../types';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, [searchParams]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`*, services(*)`)
        .eq('approval_status', 'approved');
      
      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Browse Services</h1>
        
        {loading ? <p>Inapakia...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((biz) => (
              <div key={biz.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Header ya kadi (Kama kwenye picha) */}
                <div className="h-40 bg-teal-500 relative flex items-center justify-center">
                   <span className="absolute top-4 right-4 bg-white/90 px-2 py-1 rounded text-sm font-bold text-gray-700">$$</span>
                </div>

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{biz.name}</h2>
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-current mr-1" /> {biz.rating || 4.5}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1" /> {biz.location}
                  </div>

                  <p className="text-sm font-semibold text-gray-700 mb-2">AVAILABLE SERVICES:</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {biz.services?.map((s: any) => (
                      <span key={s.id} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-medium">
                        {s.name}
                      </span>
                    ))}
                  </div>

                  <Link 
                    to={`/checkout?businessId=${biz.id}`} 
                    className="text-teal-600 font-semibold flex items-center hover:text-teal-800 transition-colors"
                  >
                    Book Appointment →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
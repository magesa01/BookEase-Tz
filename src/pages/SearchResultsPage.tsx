import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilteredBusinesses();
  }, [searchParams]);

  const fetchFilteredBusinesses = async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const category = searchParams.get('category') || '';
      const location = searchParams.get('location') || '';

      let query = supabase
        .from('businesses')
        .select(`*, services(*)`)
        .eq('approval_status', 'approved');

      // Filter za utafutaji (Hapa kazi inafanyika kama kawaida)
      if (category) query = query.eq('category', category);
      if (location && location !== 'All Locations') query = query.eq('location', location);
      
      const { data, error } = await query;
      if (error) throw error;

      // Filter ya maandishi kwa ajili ya 'q' (kama ilivyokuwa kwenye code yako ya mwanzo)
      let filteredData = data || [];
      if (q) {
        const lowerQ = q.toLowerCase();
        filteredData = filteredData.filter(biz => 
          biz.name?.toLowerCase().includes(lowerQ) ||
          biz.description?.toLowerCase().includes(lowerQ) ||
          biz.services?.some((s: any) => s.name?.toLowerCase().includes(lowerQ))
        );
      }

      setBusinesses(filteredData);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Matokeo ya Utafutaji</h1>

        {loading ? (
          <p>Inatafuta...</p>
        ) : businesses.length === 0 ? (
          <p>Hakuna biashara iliyopatikana.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <div 
                key={biz.id} 
                onClick={() => navigate(`/business/${biz.id}`)}
                className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col"
              >
                {/* Hapa ndipo Design ya Home Page ilipo */}
                <div className="aspect-video relative overflow-hidden bg-teal-600">
                   <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                     {biz.price_range || '$$'}
                   </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{biz.name}</h3>
                    <div className="flex items-center bg-amber-100 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-medium text-amber-700 ml-1">{biz.rating || 5.0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1" /> {biz.location}
                  </div>

                  {/* Services Tags kama Home Page */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Huduma:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {biz.services?.slice(0, 3).map((s: any) => (
                        <span key={s.id} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs font-medium border border-teal-100">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-teal-600 font-medium text-sm">
                    <span>Book Appointment</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
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
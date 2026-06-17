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

  // This hook ensures that whenever searchParams change (new search), we re-fetch
  useEffect(() => {
    fetchFilteredBusinesses();
  }, [searchParams]);

  const fetchFilteredBusinesses = async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const category = searchParams.get('category') || '';
      const location = searchParams.get('location') || '';

      // 1. Start with the base query
      let query = supabase
        .from('businesses')
        .select(`*, services(*)`)
        .eq('approval_status', 'approved');

      // 2. Apply Server-Side Filters (Supabase handles this)
      if (category) {
        query = query.eq('category', category);
      }
      
      if (location && location !== 'All Locations') {
        query = query.ilike('location', `%${location}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 3. Apply Text Search (Client-Side filtering for better accuracy)
      let results = data || [];
      if (q) {
        const lowerQ = q.toLowerCase();
        results = results.filter((biz) => 
          biz.name?.toLowerCase().includes(lowerQ) ||
          biz.description?.toLowerCase().includes(lowerQ) ||
          biz.services?.some((s: any) => s.name?.toLowerCase().includes(lowerQ))
        );
      }

      setBusinesses(results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Search Results</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-2xl" />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700">No results found</h2>
            <p className="text-gray-500">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <div 
                key={biz.id} 
                onClick={() => navigate(`/business/${biz.id}`)}
                className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col group"
              >
                {/* Header (Matching Home Page) */}
                <div className="h-40 bg-teal-600 relative">
                  <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">
                    {biz.price_range || '$$'}
                  </div>
                </div>

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">{biz.name}</h3>
                    <div className="flex items-center bg-amber-100 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-medium text-amber-700 ml-1">{biz.rating || 5.0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1" /> {biz.location}
                  </div>

                  {/* Services Tags */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Services:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {biz.services?.slice(0, 3).map((s: any) => (
                        <span key={s.id} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs font-medium border border-teal-100">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-teal-600 font-bold text-sm">
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
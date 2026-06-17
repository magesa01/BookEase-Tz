import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, [searchParams]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      // Replicating your Home Page data structure logic
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
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Search Results</h1>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No businesses found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <div 
                key={biz.id} 
                onClick={() => navigate(`/business/${biz.id}`)}
                className="cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group"
              >
                {/* Teal Header - Matching Home Page Style */}
                <div className="h-40 bg-teal-500 relative flex items-center justify-center">
                   <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-gray-700">
                     {biz.price_range || '$$'}
                   </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-teal-600">
                      {biz.name}
                    </h2>
                    <div className="flex items-center bg-amber-100 px-2 py-1 rounded-lg shrink-0">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-medium text-amber-700 ml-1">
                        {biz.rating || 4.5}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="h-4 w-4 mr-1 shrink-0" /> 
                    <span className="line-clamp-1">{biz.location}</span>
                  </div>

                  {/* Services Tags */}
                  <div className="mt-auto">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Services:</h4>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {biz.services?.slice(0, 3).map((s: any) => (
                        <span key={s.id} className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-xs font-medium border border-teal-100">
                          {s.name}
                        </span>
                      ))}
                      {biz.services?.length > 3 && (
                        <span className="text-xs text-gray-500 font-medium self-center">+{biz.services.length - 3} more</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm">
                      <span>Book Appointment</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
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
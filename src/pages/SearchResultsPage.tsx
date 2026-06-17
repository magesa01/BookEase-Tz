import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Business } from '../types';

interface BusinessWithServices extends Business {
  services?: any[];
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState<BusinessWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, [searchParams]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const category = searchParams.get('category');
      const location = searchParams.get('location');
      const q = searchParams.get('q');

      let query = supabase
        .from('businesses')
        .select(`*, services(*)`)
        .eq('approval_status', 'approved');

      if (category) query = query.eq('category', category);
      if (location) query = query.ilike('location', `%${location}%`);

      const { data, error } = await query;
      if (error) throw error;

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Matokeo ya Utafutaji</h1>
        
        {loading ? (
          <div className="text-center py-20 text-gray-500">Inatafuta huduma zinazokufaa...</div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">Samahani, hatujapata biashara kwa vigezo hivi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <div key={biz.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{biz.name}</h2>
                  <span className="flex items-center text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-current mr-1" />
                    {biz.rating || 'N/A'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{biz.description}</p>
                
                <div className="flex items-center text-gray-500 text-xs mb-4 gap-4">
                  <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {biz.location}</span>
                </div>

                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3">Huduma Zinazopatikana:</h4>
                  <div className="flex flex-wrap gap-2">
                    {biz.services?.length ? (
                      biz.services.map((service: any) => (
                        <Link 
                          key={service.id} 
                          to={`/checkout?serviceId=${service.id}&businessId=${biz.id}`}
                          className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200 hover:bg-teal-600 hover:text-white transition-all"
                        >
                          {service.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Hakuna huduma zilizoorodheshwa</span>
                    )}
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
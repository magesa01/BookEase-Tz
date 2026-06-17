import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Business, Category } from '../types';

interface BusinessWithServices extends Business {
  services?: any[];
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

      // 1. Query ya msingi - tumia select('*', services(*)) ili kupata data kwa ufanisi zaidi
      let query = supabase
        .from('businesses')
        .select(`*, services(*)`)
        .eq('approval_status', 'approved');

      if (category) query = query.eq('category', category);
      if (location) query = query.ilike('location', `%${location}%`);

      const { data, error } = await query;
      if (error) throw error;

      // 2. Client-side filtering kwa ajili ya search query (q) 
      // Hii ni njia salama zaidi kuliko kujenga string ndefu ya SQL query
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

  if (loading) return <div className="p-10 text-center">Inapakia...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Matokeo ya Utafutaji</h1>
        
        {businesses.length === 0 ? (
          <p>Hakuna biashara iliyopatikana kwa vigezo hivi.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((biz) => (
              <div key={biz.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold">{biz.name}</h2>
                <p className="text-gray-600 text-sm mt-2">{biz.description}</p>
                <div className="mt-4">
                  <span className="text-xs font-semibold bg-teal-100 text-teal-800 px-2 py-1 rounded">
                    {biz.category}
                  </span>
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
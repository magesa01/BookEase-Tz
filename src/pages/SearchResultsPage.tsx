import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Search, Filter, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Business, Category, categoryLabels } from '../types';

interface BusinessWithServices extends Business {
  services?: Array<{ id: string; name: string; business_id: string; [key: string]: any }>;
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>((searchParams.get('category') as Category) || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, [searchParams]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const category = searchParams.get('category');
      const location = searchParams.get('location');
      const q = searchParams.get('q');

      // 1. Vuta services zote kwanza
      const { data: allServices, error: servicesError } = await supabase.from('services').select('*');
      if (servicesError) throw servicesError;

      // 2. Query ya biashara
      let query = supabase.from('businesses').select('*').eq('approval_status', 'approved');

      if (category) query = query.eq('category', category);
      if (location) query = query.ilike('location', `%${location}%`);

      if (q) {
        // Tafuta kwa jina, maelezo, au kupitia huduma
        const matchingServiceIds = allServices?.filter(s => s.name?.toLowerCase().includes(q.toLowerCase())).map(s => s.business_id) || [];
        const ids = [...new Set(matchingServiceIds)]; // unique IDs
        
        if (ids.length > 0) {
          query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,id.in.(${ids.join(',')})`);
        } else {
          query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
        }
      }

      const { data: businessesData, error: businessError } = await query;
      if (businessError) throw businessError;

      // 3. Mapping
      const finalMappedData = (businessesData || []).map((biz) => ({
        ...biz,
        services: allServices?.filter(s => s.business_id === biz.id) || []
      }));

      setBusinesses(finalMappedData);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (categoryFilter) params.set('category', categoryFilter);
    if (locationFilter) params.set('location', locationFilter);
    navigate(`/search?${params.toString()}`);
  };

  const sortedBusinesses = useMemo(() => {
    return [...businesses].sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return a.name.localeCompare(b.name);
    });
  }, [businesses, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {/* Search UI hapa ... (kama ulivyokuwa nayo) */}
        {/* Results Grid hapa ... (kama ulivyokuwa nayo) */}
      </main>
      <Footer />
    </div>
  );
}
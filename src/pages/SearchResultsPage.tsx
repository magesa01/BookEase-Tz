import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Search, Filter, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Business, Category, categoryLabels } from '../types';

interface BusinessWithServices extends Business {
  services?: Array<{
    id: string;
    name: string;
    price: number;
    [key: string]: any; // Inaruhusu nguzo za ziada kama duration_minutes bila TypeScript kusumbua
  }>;
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>(
    (searchParams.get('category') as Category) || ''
  );
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

      // Hatua ya 1: Vuta huduma zote kwanza ili tuzitumie kwenye baji na kuchuja ID za biashara
      const { data: allServices, error: servicesError } = await supabase
        .from('services')
        .select('*');

      if (servicesError) throw servicesError;

      // Hatua ya 2: Kama kuna neno lililosachiwa (q), tunapata ID za biashara zenye huduma hiyo
      let businessIdsFromServices: string[] = [];
      if (q && allServices) {
        const matchedServices = allServices.filter(service => 
          service.name && service.name.toLowerCase().includes(q.toLowerCase())
        );
        businessIdsFromServices = matchedServices.map(service => service.business_id);
      }

      // Hatua ya 3: Jenga query ya biashara (Bila join ya Supabase ili isivuruge safu ya Available Services)
      let query = supabase.from('businesses').select('*');

      // Onyesha tu biashara zilizothibitishwa (Approved)
      query = query.eq('approval_status', 'approved');

      if (category) {
        query = query.eq('category', category);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (q) {
        if (businessIdsFromServices.length > 0) {
          // Kama neno lipo kwenye huduma, tafuta kwa jina la biashara, maelezo, au ID zilizopatikana
          const idsString = businessIdsFromServices.join(',');
          query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,id.in.(${idsString})`);
        } else {
          // Kama halipo kwenye huduma, tafuta kwenye jina na maelezo ya biashara tu
          query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
        }
      }

      const { data: businessesData, error: businessError } = await query;
      if (businessError) throw businessError;

      // Hatua ya 4: Unganisha biashara na huduma zake kwa kutumia JavaScript safi upande wa React
      const finalMappedData = (businessesData || []).map((biz) => {
        const bizServices = allServices ? allServices.filter(s => s.business_id === biz.id) : [];
        return {
          ...biz,
          services: bizServices
        };
      });

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
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
  }, [businesses, sortBy]);

  const handleBusinessClick = (id: string) => {
    navigate(`/business/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        {/* Search Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search businesses or services (e.g. Hair cut)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as Category | '')}
                  className="flex-1 md:w-40 px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                >
                  <option value="">All Categories</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="flex-1 md:w-40 px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {categoryFilter ? categoryLabels[categoryFilter] : 'All Services'}
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Searching...' : `${businesses.length} businesses found`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rating' | 'name')}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-teal-500 outline-none"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filters</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="aspect-video bg-gray-200 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h2>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBusinesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleBusinessClick(business.id)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-video relative overflow-hidden">
                      {business.image_url ? (
                        <img
                          src={business.image_url}
                          alt={business.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                        {business.price_range}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                          {business.name}
                        </h3>
                        <div className="flex items-center bg-amber-100 px-2 py-1 rounded-lg">
                          <Star className="h-4 w-4 text-amber-500 fill-current" />
                          <span className="text-sm font-medium text-amber-700 ml-1">
                            {business.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        {business.location}
                      </div>
                      {business.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                          {business.description}
                        </p>
                      )}

                      {/* Muonekano wa Huduma (Available Services) */}
                      <div className="mt-4 border-t pt-3 border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Services:</h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {business.services && business.services.length > 0 ? (
                            business.services.slice(0, 3).map((service) => (
                              <span 
                                key={service.id} 
                                className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs font-medium border border-teal-100"
                              >
                                {service.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No services registered</span>
                          )}
                          {business.services && business.services.length > 3 && (
                            <span className="text-xs text-gray-500 font-medium self-center pl-1">
                              +{business.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                  
                  <div className="px-6 pb-6 pt-2">
                    <div className="flex items-center gap-2 text-teal-600 font-medium text-sm">
                      <span>Book Appointment</span>
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

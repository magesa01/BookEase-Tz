import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors,
  Car,
  Stethoscope,
  Sparkles,
  Search,
  MapPin,
  Star,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category, categoryLabels } from '../types';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import Login from './Login';
import Register from './Register';

// Muundo wa data kwa ajili ya biashara zikiwa na huduma zake
interface BusinessWithServices {
  id: string;
  name: string;
  location: string;
  rating: number;
  image_url?: string;
  price_range?: string;
  description?: string;
  category: string;
  services: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

const categories: { id: Category; name: string; icon: React.ReactNode; image: string }[] = [
  {
    id: 'salon',
    name: 'Salons',
    icon: <Scissors className="h-8 w-8" />,
    image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'barbershop',
    name: 'Barbershops',
    icon: <Scissors className="h-8 w-8" />,
    image: 'https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'clinic',
    name: 'Clinics',
    icon: <Stethoscope className="h-8 w-8" />,
    image: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'beauty_center',
    name: 'Beauty Centers',
    icon: <Sparkles className="h-8 w-8" />,
    image: 'https://images.pexels.com/photos/3757655/pexels-photo-3757655.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'car_wash',
    name: 'Car Washes',
    icon: <Car className="h-8 w-8" />,
    image: 'https://images.pexels.com/photos/33093191/pexels-photo-33093191.jpeg',
  },
];

const locations = [
  'All Locations',
  'Dar es Salaam, Kinondoni',
  'Dar es Salaam, Ilala',
  'Dar es Salaam, Upanga',
  'Dar es Salaam, Masaki',
  'Arusha, CBD',
  'Mwanza, Nyamagana',
  'Dodoma, Central',
];

const features = [
  {
    icon: <Clock className="h-6 w-6 text-teal-600" />,
    title: 'Save Time',
    description: 'Skip the queue by booking your appointment in advance',
  },
  {
    icon: <Star className="h-6 w-6 text-teal-600" />,
    title: 'Verified Businesses',
    description: 'All service providers are vetted for quality',
  },
  {
    icon: <MapPin className="h-6 w-6 text-teal-600" />,
    title: 'Find Nearby',
    description: 'Discover services close to your location',
  },
];

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [showForm, setShowForm] = useState<'none' | 'login' | 'register'>('none');
  
  // State za kushika data za default kutoka kwenye database
  const [defaultBusinesses, setDefaultBusinesses] = useState<BusinessWithServices[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const navigate = useNavigate();

  // Vuta biashara zote na huduma zake database inapofunguka tu
  useEffect(() => {
    const fetchAllRegisteredServices = async () => {
      try {
        setLoadingServices(true);

        // 1. Vuta huduma zote zilizopo
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');

        if (servicesError) throw servicesError;

        // 2. Vuta biashara zote zilizothibitishwa (approved)
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select('*')
          .eq('approval_status', 'approved');

        if (businessesError) throw businessesError;

        // 3. Changanya data hizi mbili kwa upande wa Client (Mapping)
        const mappedData = (businessesData || []).map((biz) => {
          return {
            ...biz,
            services: (servicesData || []).filter((s) => s.business_id === biz.id),
          };
        });

        setDefaultBusinesses(mappedData);
      } catch (error) {
        console.error('Shida imetokea wakati wa kuvuta default services:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchAllRegisteredServices();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedLocation && selectedLocation !== 'All Locations') {
      params.set('location', selectedLocation);
    }
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (category: Category) => {
    navigate(`/search?category=${category}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDA0MHYxMDBIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Book Your Time, Skip the Line
              </h1>
              <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto">
                Tanzania's premier platform for booking appointments with salons, clinics, car washes, and more.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for services or businesses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-gray-800 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as Category | '')}
                      className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-gray-800 appearance-none bg-white cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full md:w-52 pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-gray-800 appearance-none bg-white cursor-pointer"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto self-end px-8 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  Search Services
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* Features Section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-6 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-teal-100">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEHEMU MPYA: Default Registered Providers Section */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Explore Registered Providers
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Check out the service providers currently available on our platform. Book your appointment instantly!
              </p>
            </div>

            {loadingServices ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm h-80 animate-pulse p-6 space-y-4 border border-gray-100">
                    <div className="bg-gray-200 h-40 w-full rounded-xl" />
                    <div className="bg-gray-200 h-6 w-3/4 rounded" />
                    <div className="bg-gray-200 h-4 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            ) : defaultBusinesses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic">
                No registered businesses found in the database yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defaultBusinesses.map((business) => (
                  <div
                    key={business.id}
                    onClick={() => navigate(`/business/${business.id}`)}
                    className="cursor-pointer group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-gray-100"
                  >
                    <div>
                      <div className="aspect-video relative overflow-hidden bg-gray-100">
                        {business.image_url ? (
                          <img
                            src={business.image_url}
                            alt={business.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold p-4 text-center">
                            {business.name}
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                          {business.price_range || '$$'}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                            {business.name}
                          </h3>
                          <div className="flex items-center bg-amber-100 px-2 py-1 rounded-lg shrink-0">
                            <Star className="h-4 w-4 text-amber-500 fill-current" />
                            <span className="text-sm font-medium text-amber-700 ml-1">
                              {(business.rating || 5.0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm mb-3">
                          <MapPin className="h-4 w-4 mr-1 shrink-0" />
                          <span className="line-clamp-1">{business.location}</span>
                        </div>

                        {/* Available Services Tags */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
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
                              <span className="text-xs text-gray-400 italic">General services available</span>
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
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Auth Forms Section */}
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Sign in or create an account</h2>
              <p className="text-gray-600">Quick access for customers and business owners</p>
            </div>
            <div className="flex justify-center gap-4 mb-6">
              <button onClick={() => setShowForm('login')} className={`px-4 py-2 rounded-lg ${showForm === 'login' ? 'bg-teal-600 text-white' : 'bg-white border'}`}>
                Login
              </button>
              <button onClick={() => setShowForm('register')} className={`px-4 py-2 rounded-lg ${showForm === 'register' ? 'bg-teal-600 text-white' : 'bg-white border'}`}>
                Register
              </button>
            </div>
            <div className="flex justify-center">
              {showForm === 'login' && <Login />}
              {showForm === 'register' && <Register />}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Browse by Category
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Find the perfect service provider from our wide range of categories
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left w-full"
                >
                  <div className="aspect-[4/5]">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <div className="mb-2 transform group-hover:scale-110 transition-transform">
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <div className="flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm text-teal-300">Browse</span>
                      <ArrowRight className="h-4 w-4 ml-1 text-teal-300" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-teal-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-teal-100 max-w-2xl mx-auto mb-8">
              Join thousands of Tanzanians who save time by booking their appointments online.
            </p>
            <button
              onClick={handleSearch}
              className="px-8 py-4 bg-white text-teal-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Find a Service Provider
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
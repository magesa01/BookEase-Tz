import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import toast from 'react-hot-toast';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ImageCarousel } from '../components/ImageCarousel';
import { Business, Category, Service, categoryLabels } from '../types';

type BusinessWithServices = Business & {
  services?: Service[];
};



const cardListVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};


const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const serviceHeroImages = [
  '/images/saloon.jpg',
  '/images/clinics.jpg',
  '/images/barbashop.jpg',
  '/images/car%20wash.jpg',
];

const normalizeSearchText = (value: unknown) =>
  String(value ?? '').trim().toLowerCase();

const normalizeCategoryToDbKey = (value: string): Category | null => {

  const normalized = value.trim();
  if (!normalized) return null;


    // 1) Try direct match against DB keys (case-insensitive)
    const direct = (Object.keys(categoryLabels) as Category[]).find(
      (k) => k.toLowerCase() === normalized.toLowerCase()
    );
    if (direct) return direct;

    // 2) Try match against display labels (case-insensitive)
    const byLabel = (Object.entries(categoryLabels) as [Category, string][]).find(
      ([, label]) => label.toLowerCase() === normalized.toLowerCase()
    );
    return byLabel?.[0] ?? null;
  };


function BusinessCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col animate-pulse">
      <div className="h-40 bg-teal-50 relative">
        <div className="absolute top-4 right-4 h-7 w-14 rounded-full bg-white" />
      </div>
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="h-5 w-2/3 rounded-lg bg-gray-200" />
          <div className="h-7 w-14 rounded-lg bg-amber-100" />
        </div>
        <div className="h-4 w-1/2 rounded-lg bg-gray-200 mb-4" />
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
          <div className="flex flex-wrap gap-1.5">
            <div className="h-6 w-20 rounded-md bg-teal-50 border border-teal-100" />
            <div className="h-6 w-24 rounded-md bg-teal-50 border border-teal-100" />
            <div className="h-6 w-16 rounded-md bg-teal-50 border border-teal-100" />
          </div>
        </div>
        <div className="mt-6 h-4 w-32 rounded bg-teal-100" />
      </div>
    </div>
  );
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessWithServices[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(
    () => ({
      q: searchParams.get('q')?.trim() || '',
      category: searchParams.get('category')?.trim() || '',
      location: searchParams.get('location')?.trim() || '',
    }),
    [searchParams]
  );

  const fetchFilteredBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const { q, category, location } = filters;

      const categoryDbKey = category ? normalizeCategoryToDbKey(category) : null;

      // If category is provided but doesn't map to any known category key, return no results.
      if (category && !categoryDbKey) {
        setBusinesses([]);
        return;
      }

      let query = supabase
        .from('businesses')
        .select(`*, services(*)`)
        .eq('approval_status', 'approved');

      if (categoryDbKey) {
        query = query.eq('category', categoryDbKey);
      }


      if (location && location !== 'All Locations') {
        query = query.ilike('location', `%${location}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data || []) as BusinessWithServices[];
      if (q) {
        const lowerQ = normalizeSearchText(q);
        results = results.filter((biz) =>
          normalizeSearchText(biz.name).includes(lowerQ) ||
          normalizeSearchText(biz.description).includes(lowerQ) ||
          biz.services?.some((service) => normalizeSearchText(service.name).includes(lowerQ))
        );
      }

      setBusinesses(results);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error occurred while loading businesses.');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // This hook ensures that whenever searchParams change (new search), we re-fetch.
  useEffect(() => {
    fetchFilteredBusinesses();
  }, [fetchFilteredBusinesses]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="relative mb-12 overflow-hidden rounded-2xl">
          <ImageCarousel images={serviceHeroImages} className="h-[340px] md:h-[420px]" />
          <div className="absolute inset-0 flex items-center px-6 md:px-12">
            <div className="max-w-2xl text-white">
              <h1 className="text-3xl font-bold md:text-5xl">Find trusted services near you</h1>
              <p className="mt-4 max-w-xl text-base text-white/90 md:text-lg">
                Browse salons, clinics, car washes, and local providers ready for instant booking.
              </p>
            </div>
          </div>
        </section>

        <h1 className="text-3xl font-bold mb-8 text-gray-900">Search Results</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700">No results found</h2>
            <p className="text-gray-500">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <motion.div
            variants={cardListVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {businesses.map((biz) => (
              <motion.div
                key={biz.id} 
                variants={cardVariants}
                whileHover={{ y: -4 }}
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
                      {biz.services?.slice(0, 3).map((s) => (
                        <span key={s.id} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs font-medium border border-teal-100">
                          {s.name}
                        </span>
                      ))}
                      {(!biz.services || biz.services.length === 0) && (
                        <span className="text-xs text-gray-400 italic">General services available</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-teal-600 font-bold text-sm">
                    <span>Book Appointment</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}

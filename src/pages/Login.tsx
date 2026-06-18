import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ImageCarousel } from '../components/ImageCarousel';

const authCarouselImages = [
  '/images/saloon.jpg',
  '/images/clinics.jpg',
  '/images/barbashop.jpg',
  '/images/car%20wash.jpg',
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If already signed in via Supabase, redirect by role (kwa watumiaji wengine)
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user ?? null;
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).maybeSingle();
        const role = profile?.role || 'customer';
        navigate(role === 'business_owner' || role === 'business' ? '/dashboard/business' : '/dashboard/customer');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. ANGALIA KWANZA KAMA NI ADMIN (Augustine)
      if (email === 'augustine@gmail.com' && password === 'bookease') {
        // Mpeleke moja kwa moja kwenye Admin Dashboard Route yako
        // Badilisha '/admin' kuwa route sahihi unayotumia kwenye App.tsx (mfano: '/admin-dashboard')
        navigate('/admin'); 
        setLoading(false);
        return; // Maliza function hapa hapa asiendelee chini
      }

      // 2. KAMA SIO ADMIN, MFUMO UENDELEE KUANGALIA DATABASE YA SUPABASE KAMA KAWAIDA
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const user = data.user;
      if (!user) {
        setError('Login failed: no user returned');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const role = (profile && (profile as any).role) || 'customer';

      if (role === 'business_owner' || role === 'business') {
        navigate('/dashboard/business');
      } else {
        navigate('/dashboard/customer');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto grid w-full max-w-6xl items-stretch gap-8 lg:grid-cols-2">
          <div className="hidden min-h-[560px] lg:block">
            <ImageCarousel images={authCarouselImages} className="h-full shadow-xl" />
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="bg-white rounded-2xl shadow p-8">
                <h2 className="text-2xl font-semibold mb-2">Sign in to your account</h2>
                <p className="text-sm text-gray-500 mb-6">Sign in as a Customer, Business Owner or Admin</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-200 outline-none"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-200 outline-none"
                      placeholder="Your password"
                      required
                    />
                  </div>

                  {error && <div className="text-sm text-red-600">{error}</div>}

                  <div>
                    <button
                      type="submit"
                      className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-medium disabled:opacity-60"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">Don't have an account? <Link to="/register" className="text-teal-600 font-medium">Register</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

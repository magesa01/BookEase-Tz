import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'business_owner'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Angalia kama mtumiaji alishajiunga tayari
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user ?? null;
      if (user) navigate('/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Msajili mtumiaji kwenye mfumo wa Auth wa Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      const userId = data.user?.id;

      if (userId) {
        // 2. Ingiza wasifu wa mtumiaji kwenye table ya user_profiles
        // Hapa tunatuma 'id' na 'user_id' zote mbili ili kuzuia error yoyote ya database
        const { error: insertError } = await supabase.from('user_profiles').insert([
          { 
            id: userId,
            user_id: userId, 
            full_name: fullName || email.split('@')[0], 
            email: email.toLowerCase().trim(), 
            role: role 
          }
        ]);
        if (insertError) throw insertError;

        // 3. Elekeza mtumiaji kwenye Dashboard yake kulingana na jukumu lake
        if (data.user) {
          if (role === 'business_owner') {
            navigate('/dashboard/business');
          } else {
            navigate('/dashboard/customer');
          }
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-2xl font-semibold mb-2">Create your account</h2>
            <p className="text-sm text-gray-500 mb-6">Choose whether you're registering as a Customer or Business Owner</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-200 outline-none"
                  placeholder="Your full name"
                  required
                />
              </div>

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
                  placeholder="Choose a secure password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Register as</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="customer"
                      checked={role === 'customer'}
                      onChange={() => setRole('customer')}
                      className="accent-teal-600"
                    />
                    <span className="text-sm">Customer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="business_owner"
                      checked={role === 'business_owner'}
                      onChange={() => setRole('business_owner')}
                      className="accent-teal-600"
                    />
                    <span className="text-sm">Business Owner</span>
                  </label>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-medium disabled:opacity-60 transition-all hover:bg-teal-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">Already have an account? <Link to="/login" className="text-teal-600 font-medium">Sign in</Link></p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
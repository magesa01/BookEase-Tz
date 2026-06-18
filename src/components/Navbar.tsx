import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-teal-600" />
            <span className="text-xl font-bold text-gray-900">BookEase TZ</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/search"
              className={`text-sm font-medium transition-colors ${
                isActive('/search') ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              Browse Services
            </Link>
            <a
              href="#categories"
              className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
            >
              Categories
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-teal-600' : 'text-gray-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/search"
                className={`text-sm font-medium transition-colors ${
                  isActive('/search') ? 'text-teal-600' : 'text-gray-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Services
              </Link>
              <a
                href="#categories"
                className="text-sm font-medium text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </a>
              <hr className="border-gray-100" />
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm font-medium text-gray-700">{user.email}</div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg text-center border border-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../lib/supabase'; 
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'; 

interface Service {
  id: string;
  name: string;
  price: number;
  business_id: string; 
}

interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  approval_status: string; 
  services: Service[]; 
}

export function AdminDashboardPage() {
  const [authenticated, setAuthenticated] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); 
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [servicesErrorMsg, setServicesErrorMsg] = useState<string | null>(null); 

  const fetchAllBusinessesAndServices = async () => {
    setLoading(true);
    setServicesErrorMsg(null); 
    try {
      // 1. Fetch all businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('id, name, category, location, approval_status')
        .order('created_at', { ascending: false });

      if (businessesError) throw businessesError;

      // 2. Fetch all services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services') 
        .select('id, name, price, business_id'); 

      if (servicesError) {
        setServicesErrorMsg(servicesError.message);
        console.error('Supabase Services Error Details:', servicesError);
      }

      // 3. Map services to their respective businesses
      const finalMappedBusinesses = (businessesData || []).map((biz) => {
        const matchingServices = (servicesData || []).filter(
          (s) => s.business_id === biz.id 
        );
        return {
          ...biz,
          approval_status: biz.approval_status || 'pending', 
          services: matchingServices,
        };
      });

      setBusinesses(finalMappedBusinesses);
    } catch (err: any) {
      console.error('General Admin Dashboard Error:', err.message);
      alert('System Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update business status to approved or failed
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'failed') => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ approval_status: newStatus }) 
        .eq('id', id);

      if (error) throw error;
      
      // Update UI state instantly
      setBusinesses(prev =>
        prev.map(b => (b.id === id ? { ...b, approval_status: newStatus } : b))
      );
    } catch (err: any) {
      alert('Failed to update business status: ' + err.message);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchAllBusinessesAndServices();
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (username === 'augustine@gmail.com' && password === 'bookease') {
      setAuthenticated(true);
      setUsername('');
      setPassword('');
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setBusinesses([]);
    navigate('/login'); 
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 outline-none focus:border-teal-500"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 outline-none focus:border-teal-500"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 transition-colors">
                Unlock Admin
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Central Management System for BookEase TZ</p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 font-medium text-white rounded-lg hover:bg-red-700 transition-colors">
            Logout
          </button>
        </div>

        <div className="space-y-6">
          {/* Error Alert Display */}
          {servicesErrorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Error Fetching Services</h4>
                <p className="text-xs mt-1 bg-white/50 p-2 rounded border border-red-100 font-mono">{servicesErrorMsg}</p>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Registered Businesses & Services</h2>
              <button 
                onClick={fetchAllBusinessesAndServices} 
                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm">Loading data...</p>
            ) : businesses.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No registered businesses found in the system.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600">
                      <th className="p-3">Business Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Available Services</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {businesses.map((biz) => (
                      <tr key={biz.id} className="hover:bg-gray-50/80">
                        <td className="p-3 font-medium text-gray-900">{biz.name}</td>
                        <td className="p-3 capitalize">{biz.category}</td>
                        <td className="p-3">{biz.location}</td>
                        
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {servicesErrorMsg ? (
                              <span className="text-xs text-red-500 italic font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Fetch Failed
                              </span>
                            ) : biz.services && biz.services.length > 0 ? (
                              biz.services.map((service) => (
                                <span 
                                  key={service.id} 
                                  className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded text-xs font-medium"
                                >
                                  {service.name} ({service.price}/=)
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">No services added</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                            biz.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                            biz.approval_status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {biz.approval_status}
                          </span>
                        </td>

                        <td className="p-3 flex items-center justify-center gap-2">
                          {biz.approval_status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(biz.id, 'approved')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </button>
                          )}
                          {biz.approval_status !== 'failed' && (
                            <button
                              onClick={() => handleUpdateStatus(biz.id, 'failed')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Fail
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2">System Settings</h3>
              <p className="text-sm text-gray-500">This section is restricted for server safety.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-2">User Management</h3>
              <p className="text-sm text-gray-500">Registered Clients: Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
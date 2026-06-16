import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Settings,
  Receipt,
  ChevronRight,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BookingWithDetails, UserProfile, paymentMethods } from '../types';

type Tab = 'appointments' | 'history' | 'settings';

export function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([]);
  const [pastBookings, setPastBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id);
      await fetchDashboardData(user.id);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async (authUserId?: string | null) => {
    try {
      const uid = authUserId || userId;
      if (!uid) return;

      // Fetch user profile by auth user_id
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData as UserProfile);
        setFormData({
          full_name: profileData.full_name,
          email: profileData.email || '',
          phone: profileData.phone || '',
        });
      }

      const profileId = (profileData as any)?.id;
      if (!profileId) {
        setUpcomingBookings([]);
        setPastBookings([]);
        return;
      }

      // Fetch upcoming bookings by profile id
      const { data: upcomingData } = await supabase
        .from('bookings')
        .select(`
          *,
          businesses (id, name, location, category, phone),
          services (id, name, price, duration_minutes)
        `)
        .eq('customer_id', profileId)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true });

      if (upcomingData) {
        setUpcomingBookings(
          upcomingData.map((b) => ({
            ...b,
            business: b.businesses,
            service: b.services,
          }))
        );
      }

      // Fetch past bookings
      const { data: pastData } = await supabase
        .from('bookings')
        .select(`
          *,
          businesses (id, name, location, category, phone),
          services (id, name, price, duration_minutes)
        `)
        .eq('customer_id', profileId)
        .or(`booking_date.lt.${new Date().toISOString().split('T')[0]},status.eq.completed,status.eq.cancelled`)
        .order('booking_date', { ascending: false });

      if (pastData) {
        setPastBookings(
          pastData.map((b) => ({
            ...b,
            business: b.businesses,
            service: b.services,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const profileId = profile?.id;
      if (!profileId) throw new Error('Profile not found');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
        })
        .eq('id', profileId);

      if (error) throw error;
      setProfile((prev) =>
      prev ? { ...prev, full_name: formData.full_name, email: formData.email, phone: formData.phone } : null
    );
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tz-TZ').format(price) + ' TSh';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-amber-100 text-amber-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodName = (method: string) => {
    return paymentMethods.find((p) => p.id === method)?.name || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name || 'Customer'}
            </h1>
            <p className="text-gray-600 mt-1">Manage your appointments and profile settings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-teal-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{pastBookings.filter((b) => b.status === 'completed').length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Receipts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pastBookings.filter((b) => b.payment_status === 'completed').length}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-lg font-bold text-gray-900">
                    {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}
                  </p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'appointments'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Upcoming Appointments
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Receipt className="h-4 w-4 inline mr-2" />
                  Booking History
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  Profile Settings
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <div>
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Appointments</h3>
                      <p className="text-gray-500 mb-6">Book your next appointment today!</p>
                      <Link
                        to="/search"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
                      >
                        Browse Services
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-teal-200 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                              {getStatusIcon(booking.status)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.business?.name}</h4>
                              <p className="text-sm text-gray-600">{booking.service?.name}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(booking.booking_date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {booking.booking_time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {booking.business?.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">
                                {booking.service && formatPrice(booking.service.price)}
                              </p>
                              {getStatusBadge(booking.status)}
                            </div>
                            {booking.status !== 'cancelled' && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  {pastBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Booking History</h3>
                      <p className="text-gray-500">Your completed appointments will appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Business</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Service</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Method</th> {/* Imeingizwa kwa ajili ya ile warning */}
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Receipt</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastBookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <p className="font-medium text-gray-900">{booking.business?.name}</p>
                                <p className="text-sm text-gray-500">{booking.business?.location}</p>
                              </td>
                              <td className="py-4 px-4 text-gray-600">{booking.service?.name}</td>
                              <td className="py-4 px-4">
                                <p className="text-gray-900">{formatDate(booking.booking_date)}</p>
                                <p className="text-sm text-gray-500">{booking.booking_time}</p>
                              </td>
                              <td className="py-4 px-4 font-medium text-gray-900">
                                {booking.service && formatPrice(booking.service.price)}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {booking.payment_method ? getPaymentMethodName(booking.payment_method) : '-'} {/* Hapa ndipo tulipoitumia ile function */}
                              </td>
                              <td className="py-4 px-4 font-mono text-sm text-gray-600">
                                {booking.receipt_number || '-'}
                              </td>
                              <td className="py-4 px-4">{getStatusBadge(booking.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h3>

                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50"
                        >
                          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">{profile?.full_name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-medium text-gray-900">{profile?.phone || 'Not set'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-medium text-gray-900">{profile?.email || 'Not set'}</p>
                      </div>
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
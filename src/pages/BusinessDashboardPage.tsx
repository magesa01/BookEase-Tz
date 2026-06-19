import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import {
  Plus,
  X,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  TrendingUp,
  Settings,
  Briefcase,
  Layers,
  Camera
} from 'lucide-react';
import { Business, Service, Booking } from '../types';

type Tab = 'overview' | 'services' | 'settings';
type FeedbackMessage = { type: 'success' | 'error'; text: string };

export default function BusinessDashboardPage(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    category: '',
    phone: '',
    location: '',
    description: '',
    opening_time: '08:00',
    closing_time: '18:00',
    banner_url: '',
    status: 'open',
  });
  const [regStep, setRegStep] = useState(1);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', duration_minutes: '30' });
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
  const [serviceImagePreview, setServiceImagePreview] = useState<string | null>(null);
  const [serviceImageUploading, setServiceImageUploading] = useState(false);

  const [savingService, setSavingService] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<FeedbackMessage | null>(null);
  const [profileMessage, setProfileMessage] = useState<FeedbackMessage | null>(null);
  const [bookingMessage, setBookingMessage] = useState<FeedbackMessage | null>(null);
  const [serviceMessage, setServiceMessage] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, []);

  async function uploadBanner(file: File) {
    if (!file) return null;
    setBannerMessage(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setBannerMessage({ type: 'error', text: 'You must be logged in to upload a banner image.' });
        return null;
      }
    } catch (e) {
      console.error('Auth check failed', e);
    }
    try {
      setBannerUploading(true);
      const filePath = `banners/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('business-banners').upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: publicData } = supabase.storage.from('business-banners').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;
      setProfileForm((p) => ({ ...p, banner_url: publicUrl }));
      setBannerPreview(publicUrl);
      
      if (business && (business as any).id) {
        try {
          const { error: saveErr } = await supabase.from('businesses').update({ banner_url: publicUrl }).eq('id', (business as any).id);
          if (saveErr) throw saveErr;
          setBusiness((b) => b ? ({ ...b, banner_url: publicUrl } as Business) : b);
        } catch (e) {
          console.error('Failed to persist banner_url to DB', e);
        }
      }
      setBannerMessage({ type: 'success', text: 'Banner image uploaded successfully.' });
      return publicUrl;
    } catch (err) {
      console.error('Upload failed', err);
      const message = (err as any)?.message || JSON.stringify(err);
      setBannerMessage({ type: 'error', text: `Failed to upload banner image: ${message}` });
      return null;
    } finally {
      setBannerUploading(false);
    }
  }

  async function fetchDashboardData() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setHasProfile(false);
        return;
      }
      const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).limit(1).maybeSingle();
      if (!biz) {
        setHasProfile(false);
        setBusiness(null);
        setServices([]);
        setBookings([]);
        return;
      }
      setBusiness(biz as Business);
      setHasProfile(true);
      setProfileForm((p) => ({ ...p, ...(biz as any) }));
      const { data: sv } = await supabase.from('services').select('*').eq('business_id', (biz as any).id).order('created_at', { ascending: false });
      setServices((sv as Service[]) || []);
      const { data: bk } = await supabase.from('bookings').select('*').eq('business_id', (biz as any).id).order('created_at', { ascending: false });
      setBookings((bk as Booking[]) || []);
    } catch (e) {
      console.error('Error fetching business dashboard data:', e);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterBusiness() {
    if (!profileForm.name.trim()) {
      setRegError('Business name is required');
      return;
    }
    setRegError(null);
    setRegistering(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error('Authentication session missing. Please log in again.');
      const payload = {
        user_id: user.id,
        name: profileForm.name,
        category: profileForm.category,
        phone: profileForm.phone,
        location: profileForm.location,
        description: profileForm.description,
        opening_time: profileForm.opening_time,
        closing_time: profileForm.closing_time,
        banner_url: profileForm.banner_url,
        status: profileForm.status
      };
      const { data: created, error } = await supabase.from('businesses').insert(payload).select().maybeSingle();
      if (error) throw error;
      setBusiness(created as Business);
      setHasProfile(true);
      await fetchDashboardData();
    } catch (err: any) {
      setRegError(err?.message || 'An error occurred during registration. Please try again.');
    } finally {
      setRegistering(false);
    }
  }

  async function updateBusinessField(fieldsToUpdate: Record<string, any>) {
    if (!business) return;
    setProfileMessage(null);
    try {
      const { error } = await supabase.from('businesses').update(fieldsToUpdate).eq('id', (business as any).id);
      if (error) throw error;
      setBusiness((b) => b ? ({ ...b, ...fieldsToUpdate } as Business) : b);
      setProfileForm((p) => ({ ...p, ...fieldsToUpdate }));
      setEditingProfile(false);
      setProfileMessage({ type: 'success', text: 'Business details updated successfully.' });
    } catch (e) {
      console.error('Failed to update business details:', e);
      setProfileMessage({ type: 'error', text: 'Failed to update business details.' });
    }
  }

  async function handleUpdateBookingStatus(bookingId: string, newStatus: 'confirmed' | 'cancelled') {
    setBookingMessage(null);
    setUpdatingStatusId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      setBookingMessage({ type: 'success', text: `Booking marked as ${newStatus}.` });
    } catch (e) {
      console.error('Failed to update booking status:', e);
      setBookingMessage({ type: 'error', text: 'Failed to update booking status.' });
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const SERVICE_IMAGE_BUCKET = 'service-images';
  const SERVICE_IMAGE_PLACEHOLDER_URL = '/image_cace1738.png';

  async function uploadServiceImage(file: File): Promise<string | null> {
    if (!file) return null;

    setServiceImageUploading(true);
    try {
      const filePath = `services/${Date.now()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (err) {
      console.error('Service image upload failed:', err);
      return null;
    } finally {
      setServiceImageUploading(false);
    }
  }

  async function handleSaveService() {
    setServiceMessage(null);

    if (!business) {
      setServiceMessage({ type: 'error', text: 'Kosa: Hamna taarifa za biashara (Business Profile missing)!' });
      return;
    }

    if (!serviceForm.name || !serviceForm.price) {
      setServiceMessage({ type: 'error', text: 'Tafadhali jaza Jina la Huduma na Bei kabla ya kusave!' });
      return;
    }

    setSavingService(true);
    try {
      const currentBusinessId = (business as any).id;

      let imageUrl: string | null = null;
      if (serviceImageFile) {
        imageUrl = await uploadServiceImage(serviceImageFile);
      }

      const { error } = await supabase
        .from('services')
        .insert({
          business_id: currentBusinessId,
          name: serviceForm.name,
          description: serviceForm.description || null,
          price: parseFloat(serviceForm.price),
          duration_minutes: parseInt(serviceForm.duration_minutes, 10),
          image_url: imageUrl,
        })
        .select();

      if (error) throw error;

      setShowServiceModal(false);
      setServiceForm({ name: '', description: '', price: '', duration_minutes: '30' });
      setServiceImageFile(null);
      setServiceImagePreview(null);

      await fetchDashboardData();
      setServiceMessage({ type: 'success', text: 'Huduma imehifadhiwa kikamilifu!' });
    } catch (e: any) {
      console.error('Kosa la Supabase:', e);
      setServiceMessage({ type: 'error', text: `Imeshindwa kusave! Sababu: ${e.message || JSON.stringify(e)}` });
    } finally {
      setSavingService(false);
    }
  }


  const formatPrice = (p = 0) => new Intl.NumberFormat('tz-TZ').format(p) + ' TSh';

  const renderFeedbackMessage = (message: FeedbackMessage | null) => {
    if (!message) return null;
    return (
      <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
        message.type === 'success'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}>
        {message.type === 'success' ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        )}
        <span>{message.text}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800 border border-green-200',
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </main>
      <Footer />
    </div>
  );

  // WIZARD YA USAJILI KWA AJILI YA BIASHARA MPYA
  if (!business && hasProfile === false) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header wa Wizard */}
          <div className="bg-teal-600 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold">Register Your Business</h2>
            <p className="text-teal-100 text-sm mt-1">Set up your professional BookEase TZ showcase in just a few clicks.</p>
            {/* Viashiria vya Hatua (Steps Progress) */}
            <div className="flex items-center gap-2 mt-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${regStep >= step ? 'bg-white text-teal-700' : 'bg-teal-500 text-teal-200'}`}>
                    {step}
                  </div>
                  <div className={`flex-1 h-1 rounded transition-colors ${regStep > step ? 'bg-white' : 'bg-teal-500'}`} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-8">
            {regStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-teal-600 font-semibold mb-2">
                  <Building2 className="w-5 h-5" />
                  <span>Basic Information</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business / Saloon Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Sinza Executive Saloon"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={profileForm.category}
                    onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none bg-white"
                  >
                    <option value="">Select Category</option>
                    <option value="Salons">Salons</option>
                    <option value="Barbershops">Barbershops</option>
                    <option value="Clinics">Clinics</option>
                    <option value="Beauty Centers">Beauty Centers</option>
                    <option value="Car Washes">Car Washes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <textarea
                    rows={3}
                    placeholder="Tell customers about your exceptional services..."
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}
            
            {regStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-teal-600 font-semibold mb-2">
                  <Phone className="w-5 h-5" />
                  <span>Contact & Location</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g., +255 712 345 678"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Dar es Salaam, Kijitonyama"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            )}
            
            {regStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-teal-600 font-semibold mb-2">
                  <Clock className="w-5 h-5" />
                  <span>Availability & Media</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                    <input
                      type="time"
                      value={profileForm.opening_time}
                      onChange={(e) => setProfileForm({ ...profileForm, opening_time: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                    <input
                      type="time"
                      value={profileForm.closing_time}
                      onChange={(e) => setProfileForm({ ...profileForm, closing_time: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Image/Banner URL</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setBannerPreview(url);
                        await uploadBanner(file);
                      }}
                      className="block"
                    />
                    <div className="w-40 h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {bannerUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                      ) : bannerPreview || profileForm.banner_url ? (
                        <img src={bannerPreview || profileForm.banner_url || ''} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm text-gray-500">No image</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    {renderFeedbackMessage(bannerMessage)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-8 pt-4 border-t">
              <button
                disabled={regStep === 1}
                onClick={() => setRegStep((s) => Math.max(1, s - 1))}
                className="px-5 py-2.5 border rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-600 disabled:opacity-40"
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                {regError && <div className="text-red-600 text-sm font-medium max-w-xs">{regError}</div>}
                {regStep < 3 ? (
                  <button
                    onClick={() => setRegStep((s) => s + 1)}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleRegisterBusiness}
                    disabled={registering}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {registering && <Loader2 className="w-4 h-4 animate-spin" />}
                    {registering ? 'Saving Profile...' : 'Complete Registration'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  // MAIN DASHBOARD (IKISHAJILIWA)
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {/* Banner/Hero Section */}
        <div className="relative bg-gray-900 h-64 overflow-hidden">
          {profileForm.banner_url ? (
            <img src={profileForm.banner_url} alt="Business banner" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-teal-800 to-cyan-900 flex items-center px-8" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-4 right-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-white">
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal-500/30">
                {business?.category || profileForm.category || 'Professional'}
              </span>
              <h1 className="text-3xl font-extrabold mt-2 tracking-tight">{business?.name || profileForm.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-300">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-teal-400" /> {business?.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-teal-400" /> {business?.opening_time} - {business?.closing_time}</span>
                <span className={`flex items-center gap-1 font-semibold ${business?.status === 'open' ? 'text-green-400' : 'text-amber-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${business?.status === 'open' ? 'bg-green-400' : 'bg-amber-400'}`} />
                  {business?.status === 'open' ? 'Open' : 'Temporarily Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Analytics KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600"><Calendar className="w-6 h-6" /></div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Services</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{services.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Briefcase className="w-6 h-6" /></div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{bookings.filter(b => b.status === 'pending').length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><AlertCircle className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Navigation Controls & Tab Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b px-6 py-4 bg-gray-50/50 gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <TrendingUp className="w-4 h-4" /> Overview
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${activeTab === 'services' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Layers className="w-4 h-4" /> Services
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>
              <div>
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add New Service
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {renderFeedbackMessage(serviceMessage)}

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">About Our Business</h3>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-xl leading-relaxed">{business?.description || 'No description provided yet. Head over to Settings to write a lovely summary.'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Incoming Customer Requests</h3>
                    {renderFeedbackMessage(bookingMessage)}
                    {bookings.length === 0 ? (
                      <div className="text-center py-12 border border-dashed rounded-2xl bg-gray-50/50">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No appointments booked yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 border rounded-2xl overflow-hidden bg-white">
                        {bookings.map((b) => (
                          <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold shrink-0">
                                {b.customer_name?.charAt(0).toUpperCase() || 'C'}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{b.customer_name}</h4>
                                <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.booking_date} @ {b.booking_time}</span>
                                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {b.customer_phone}</span>
                                </div>
                                <p className="text-sm font-medium text-teal-700 mt-1.5 bg-teal-50 px-2 py-0.5 rounded-md inline-block">
  {(b as any).service_name} ({formatPrice((b as any).service_price)})
</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {getStatusBadge(b.status)}
                              {b.status === 'pending' && (
                                <div className="flex gap-1.5 ml-2">
                                  <button
                                    disabled={updatingStatusId !== null}
                                    onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 transition-colors"
                                    title="Confirm Booking"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    disabled={updatingStatusId !== null}
                                    onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                                    title="Cancel Booking"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SERVICES */}
              {activeTab === 'services' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Offered Services</h3>
                    <p className="text-xs text-gray-500">{services.length} items available</p>
                  </div>
                  {services.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-2xl bg-gray-50/50">
                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No services registered yet.</p>
                      <button
                        onClick={() => setShowServiceModal(true)}
                        className="mt-3 text-sm text-teal-600 font-semibold hover:underline"
                      >
                        Create your first service now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map((s) => (
                        <div key={s.id} className="p-5 border rounded-2xl bg-white shadow-xs hover:border-teal-200 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-gray-900 text-lg leading-tight">{s.name}</h4>
                              <span className="font-extrabold text-teal-600 text-base shrink-0 bg-teal-50/60 px-2.5 py-1 rounded-xl">
                                {formatPrice(s.price)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{s.description || 'No detailed description added.'}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-4 pt-3 border-t text-xs font-semibold text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" /> {s.duration_minutes} Minutes</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
                      <p className="text-xs text-gray-500">Update how your studio appears to the public</p>
                    </div>
                    <button
                      onClick={() => setEditingProfile(!editingProfile)}
                      className="px-4 py-2 border text-sm font-semibold rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {editingProfile ? 'Cancel' : 'Edit Showcase'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {renderFeedbackMessage(profileMessage)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Name</label>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                        <select
                          disabled={!editingProfile}
                          value={profileForm.category}
                          onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors bg-white font-medium text-gray-800"
                        >
                          <option value="Salons">Salons</option>
                          <option value="Barbershops">Barbershops</option>
                          <option value="Clinics">Clinics</option>
                          <option value="Beauty Centers">Beauty Centers</option>
                          <option value="Car Washes">Car Washes</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Telephone Contact</label>
                        <input
                          type="tel"
                          disabled={!editingProfile}
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Physical Station</label>
                        <input
                          type="text"
                          disabled={!editingProfile}
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors font-medium text-gray-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Opening Hour</label>
                        <input
                          type="time"
                          disabled={!editingProfile}
                          value={profileForm.opening_time}
                          onChange={(e) => setProfileForm({ ...profileForm, opening_time: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Closing Hour</label>
                        <input
                          type="time"
                          disabled={!editingProfile}
                          value={profileForm.closing_time}
                          onChange={(e) => setProfileForm({ ...profileForm, closing_time: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Status</label>
                        <select
                          disabled={!editingProfile}
                          value={profileForm.status}
                          onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
                          className="w-full px-4 py-2.5 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors bg-white font-medium text-gray-800"
                        >
                          <option value="open">Open Business</option>
                          <option value="closed">Temporarily Closed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">About Us / Summary</label>
                      <textarea
                        rows={4}
                        disabled={!editingProfile}
                        value={profileForm.description}
                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                        className="w-full px-4 py-3 border rounded-xl disabled:bg-gray-50 outline-none focus:border-teal-500 transition-colors resize-none font-medium text-gray-800 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cover Banner Image</label>
                      <div className="flex items-center gap-4">
                        {editingProfile && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = URL.createObjectURL(file);
                              setBannerPreview(url);
                              await uploadBanner(file);
                            }}
                            className="block text-sm"
                          />
                        )}
                        <div className="w-48 h-28 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center relative">
                          {bannerUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                          ) : bannerPreview || profileForm.banner_url ? (
                            <img src={bannerPreview || profileForm.banner_url || ''} alt="Showcase preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xs text-gray-400 font-semibold flex flex-col items-center gap-1"><Camera className="w-5 h-5" /> No banner image</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        {renderFeedbackMessage(bannerMessage)}
                      </div>
                    </div>

                    {editingProfile && (
                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={() => updateBusinessField(profileForm)}
                          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* =========================================================================
          MODAL YA KUSAVE HUDUMA MPYA (ADD NEW SERVICE)
          Ipo hapa mwishoni mwa return kuu ili isilete mgongano na Tabs za juu.
         ========================================================================= */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50/50 px-6 py-4 border-b">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Add New Service</h4>
                <p className="text-xs text-gray-500">Insert details of your single offering item</p>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body Form */}
            <div className="p-6 space-y-4">
              {renderFeedbackMessage(serviceMessage)}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Hair Cut & Washing"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (TSh) *</label>
                  <input
                    type="number"
                    placeholder="e.g., 10000"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Brief details about what is included..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-500 resize-none"
                  rows={2}
                />
              </div>
              {/* Service image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setServiceImageFile(file ?? null);
                      if (file) setServiceImagePreview(URL.createObjectURL(file));
                      else setServiceImagePreview(null);
                    }}
                    className="block"
                  />
                  <div className="w-40 h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-200 relative">
                    {serviceImageUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                    ) : serviceImagePreview ? (
                      <img src={serviceImagePreview} alt="service preview" className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={SERVICE_IMAGE_PLACEHOLDER_URL}
                        alt="placeholder"
                        className="w-full h-full object-cover opacity-60"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Footer buttons of modal */}
              <div className="flex gap-3 pt-2 justify-end">

                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 border text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={savingService}
                  onClick={handleSaveService}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {savingService && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingService ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

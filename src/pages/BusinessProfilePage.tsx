import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Business, Service } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

export function BusinessProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [step, setStep] = useState<'service' | 'datetime'>('service');

  useEffect(() => {
    if (id) {
      fetchBusiness();
      fetchServices();
    }
  }, [id]);

  const fetchBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', id);
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // Removed unused helper

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tz-TZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(price) + ' TSh';
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleDateTimeConfirm = () => {
    if (selectedDate && selectedTime) {
      handleProceedToCheckout();
    }
  };

  const handleProceedToCheckout = () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      return;
    }

    const params = new URLSearchParams({
      businessId: business?.id || '',
      serviceId: selectedService.id,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
    });

    navigate(`/checkout?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Business not found</h2>
            <button
              onClick={() => navigate('/search')}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Browse all services
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-teal-600 to-teal-800">
          {business.image_url && (
            <img
              src={business.image_url}
              alt={business.name}
              className="w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to results</span>
              </button>
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {business.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/90">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{business.location}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 text-amber-400 fill-current" />
                      <span className="font-medium">{business.rating.toFixed(1)}</span>
                    </div>
                    {business.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{business.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-white text-2xl font-bold">{business.price_range}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600">
                  {business.description || 'No description available.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Opening Hours</h2>
                <div className="space-y-2">
                  {business.opening_hours &&
                    Object.entries(business.opening_hours).map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                      >
                        <span className="capitalize text-gray-600">{day}</span>
                        <span className="font-medium text-gray-900">{hours || 'Closed'}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step === 'service'
                        ? 'bg-teal-600 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {step !== 'service' ? <Check className="h-5 w-5" /> : '1'}
                  </div>
                  <span
                    className={`ml-2 font-medium ${
                      step === 'service' ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Service
                  </span>
                </div>
                <div
                  className={`w-16 h-1 mx-2 ${
                    step === 'datetime' ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                />
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step === 'datetime'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`ml-2 font-medium ${
                      step === 'datetime' ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Date & Time
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Step 1: Select Service */}
                {step === 'service' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Select a Service</h2>
                    <div className="space-y-3">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}

                          className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-teal-500 ${
                            selectedService?.id === service.id
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-start gap-3">
                                <img
                                  src={service.image_url || '/image_cace1738.png'}
                                  alt={service.name}
                                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                                  loading="lazy"
                                  onError={(e) => {
                                    const img = e.currentTarget;
                                    img.src = '/image_cace1738.png';
                                  }}
                                />
                                <div>
                                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                </div>
                              </div>
                              {service.description && (

                                <p className="text-sm text-gray-600 mt-1">
                                  {service.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {service.duration_minutes} min
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-teal-600">
                                {formatPrice(service.price)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Select Date & Time */}
                {step === 'datetime' && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Select Date & Time
                    </h2>

                    {/* Selected Service Summary */}
                    {selectedService && (
                      <div className="bg-teal-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-teal-700">Selected Service</span>
                            <h3 className="font-semibold text-gray-900">
                              {selectedService.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {selectedService.duration_minutes} min
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-teal-600">
                              {formatPrice(selectedService.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Calendar */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={handlePreviousMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <h3 className="font-semibold text-gray-900">
                            {currentMonth.toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </h3>
                          <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {DAYS.map((day) => (
                            <div
                              key={day}
                              className="text-center text-xs font-medium text-gray-500 py-2"
                            >
                              {day}
                            </div>
                          ))}
                          {calendarDays.map((date, index) => (
                            <div key={index} className="aspect-square">
                              {date ? (
                                <button
                                  onClick={() =>
                                    isDateSelectable(date) && setSelectedDate(date)
                                  }
                                  disabled={!isDateSelectable(date)}
                                  className={`w-full h-full rounded-lg flex items-center justify-center text-sm transition-all ${
                                    selectedDate?.toDateString() === date.toDateString()
                                      ? 'bg-teal-600 text-white'
                                      : isDateSelectable(date)
                                      ? 'hover:bg-teal-100 text-gray-900'
                                      : 'text-gray-300 cursor-not-allowed'
                                  }`}
                                >
                                  {date.getDate()}
                                </button>
                              ) : (
                                <div className="w-full h-full" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Available Times</h3>
                        {selectedDate ? (
                          <div className="grid grid-cols-3 gap-2">
                            {TIME_SLOTS.map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`py-3 rounded-lg text-sm font-medium transition-all ${
                                  selectedTime === time
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl">
                            <p className="text-gray-500">Select a date first</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => setStep('service')}
                        className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleDateTimeConfirm}
                        disabled={!selectedDate || !selectedTime}
                        className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

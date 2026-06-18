export type Category = 'salon' | 'barbershop' | 'clinic' | 'beauty_center' | 'car_wash';

export type PaymentMethod = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'halopesa' | 'card' | 'paypal';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ApprovalStatus = 'pending' | 'approved' | 'suspended';

export type UserRole = 'customer' | 'business' | 'business_owner' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  phone?: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string | null;
  business_id: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  category: Category;
  location: string;
  description: string | null;
  image_url: string | null;
  /** Public URL for a banner image stored in Supabase Storage */
  banner_url?: string;
  price_range: string;
  rating: number;
  phone: string | null;
  opening_hours: Record<string, string> | null;
  created_at: string;
  approval_status?: ApprovalStatus;
  approved_at?: string | null;
  opening_time?: string;
  closing_time?: string;
  status?: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  created_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  receipt_number?: string;
  transaction_id?: string;
}

export interface BookingWithDetails extends Booking {
  business?: Business;
  service?: Service;
}

export const categoryLabels: Record<Category, string> = {
  salon: 'Salons',
  barbershop: 'Barbershops',
  clinic: 'Clinics',
  beauty_center: 'Beauty Centers',
  car_wash: 'Car Washes',
};

export const paymentMethods: { id: PaymentMethod; name: string; logo: string; color: string }[] = [
  { id: 'mpesa', name: 'M-Pesa', logo: 'M', color: 'bg-green-600' },
  { id: 'airtel_money', name: 'Airtel Money', logo: 'A', color: 'bg-red-600' },
  { id: 'tigo_pesa', name: 'Tigo Pesa (Mixx by Yas)', logo: 'T', color: 'bg-blue-600' },
  { id: 'halopesa', name: 'HaloPesa', logo: 'H', color: 'bg-purple-600' },
  { id: 'card', name: 'Card Payment', logo: 'C', color: 'bg-gray-700' },
  { id: 'paypal', name: 'PayPal', logo: 'P', color: 'bg-blue-600' },
];

export const locations = [
  'Dar es Salaam, Kinondoni',
  'Dar es Salaam, Ilala',
  'Dar es Salaam, Upanga',
  'Dar es Salaam, Masaki',
  'Dar es Salaam, Ubungo',
  'Arusha, CBD',
  'Arusha, Njiro',
  'Mwanza, Nyamagana',
  'Mwanza, Capri Point',
  'Dodoma, Central',
];

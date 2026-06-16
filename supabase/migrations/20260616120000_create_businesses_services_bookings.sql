-- 2026-06-16 12:00:00 UTC
-- Migration: create businesses, services, bookings, RLS policies and storage bucket for banners

-- 1. Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('salon', 'barbershop', 'clinic', 'beauty_center', 'car_wash')),
  location TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  status TEXT DEFAULT 'active',
  opening_time TEXT DEFAULT '08:00 AM',
  closing_time TEXT DEFAULT '06:00 PM',
  price_range TEXT DEFAULT '$$',
  rating DECIMAL(3,2) DEFAULT 4.5,
  phone TEXT,
  opening_hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies for public reads and booking inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'businesses' AND p.polname = 'allow_public_read_businesses'
  ) THEN
    EXECUTE $$
      CREATE POLICY allow_public_read_businesses
      ON businesses
      FOR SELECT
      USING (true);
    $$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'services' AND p.polname = 'allow_public_read_services'
  ) THEN
    EXECUTE $$
      CREATE POLICY allow_public_read_services
      ON services
      FOR SELECT
      USING (true);
    $$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'bookings' AND p.polname = 'allow_public_read_bookings'
  ) THEN
    EXECUTE $$
      CREATE POLICY allow_public_read_bookings
      ON bookings
      FOR SELECT
      USING (true);
    $$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'bookings' AND p.polname = 'allow_public_insert_bookings'
  ) THEN
    EXECUTE $$
      CREATE POLICY allow_public_insert_bookings
      ON bookings
      FOR INSERT
      WITH CHECK (true);
    $$;
  END IF;
END$$;

-- 6. Create or ensure storage bucket for banners exists (Supabase-specific)
-- Note: The storage schema is provided by Supabase. This insert is safe to run in Supabase SQL editor.
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-banners', 'business-banners', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policies for the bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'objects' AND p.polname = 'allow_public_select_business_banners'
  ) THEN
    EXECUTE $$
      CREATE POLICY allow_public_select_business_banners
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'business-banners');
    $$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'objects' AND p.polname = 'allow_authenticated_insert_business_banners'
  ) THEN
    EXECUTE $$
      CREATE POLICY allow_authenticated_insert_business_banners
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'business-banners' AND auth.role() = 'authenticated');
    $$;
  END IF;
END$$;

-- Notes: Run this migration in your Supabase project's SQL editor or via a connection using a service role key.

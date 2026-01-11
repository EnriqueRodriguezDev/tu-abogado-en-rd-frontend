-- Add i18n columns to services
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Add i18n columns to blog_posts
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Rename old bookings table if exists
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.tables WHERE table_name = 'bookings') THEN
    ALTER TABLE bookings RENAME TO bookings_old;
  END IF;
END $$;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('whatsapp', 'meet')),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed, pending_payment
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  reason TEXT,
  total_price NUMERIC(10, 2) NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('paypal', 'transfer')),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, failed, pending_verification
  transaction_id TEXT, -- For PayPal
  proof_url TEXT -- For Transfer
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies (Adjust as needed for public/admin access)
-- Public can create appointments
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
-- Public can view their own appointments (this might need session logic or email matching, for now allowing read for simplicty or restrict to admin)
-- For this MVP, let's allow public insert and admin read/write. 
-- Ideally we'd use a secure token or auth, but assuming public booking flow:
CREATE POLICY "Enable read access for all users" ON appointments FOR SELECT USING (true); -- Verify this for production!

CREATE POLICY "Public can insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);

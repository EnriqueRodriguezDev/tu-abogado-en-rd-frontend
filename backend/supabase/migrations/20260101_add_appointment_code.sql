-- Add appointment_code column to appointments table
ALTER TABLE appointments 
ADD COLUMN appointment_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_appointments_code ON appointments(appointment_code);

-- Optional: Backfill existing appointments with a code if needed
-- (Skipping backfill for simplicity, or we can add a DO block)

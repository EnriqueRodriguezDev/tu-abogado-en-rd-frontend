-- Add new columns to services table
alter table public.services 
add column if not exists slug text,
add column if not exists content text,
add column if not exists category text;

-- Create constraint for unique slugs
alter table public.services 
add constraint services_slug_key unique (slug);

-- Enable RLS for these new columns (already covered by table-wide RLS, but verifying)
alter table public.services enable row level security;

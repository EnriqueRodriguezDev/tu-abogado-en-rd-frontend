-- Enable the storage extension if not already enabled (usually enabled by default)
-- create extension if not exists "storage";

-- Create the 'images' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Allow Public Read Access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

-- Allow Authenticated Users to Upload (Insert)
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

-- Allow Authenticated Users to Update
create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'images' and auth.role() = 'authenticated' );

-- Allow Authenticated Users to Delete
create policy "Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'images' and auth.role() = 'authenticated' );

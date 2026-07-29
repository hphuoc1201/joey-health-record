-- Seed the admin. Replace the email below with YOUR Gmail address, then run
-- this in the Supabase SQL editor (Dashboard > SQL Editor).
--
-- This is the only account that can create/edit records and grant access.
insert into public.admins (email)
values (lower('hphuoc1201@gmail.com'))
on conflict (email) do nothing;

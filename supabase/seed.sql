-- Seed data for local development
-- Note: In production, users are created via Strava OAuth.
-- For local dev, we create a test user directly in auth.users first.

-- Create test user in auth schema
insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'testuser@example.com',
  '{}',
  now(),
  now(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Create user profile
insert into public.users (id, email, strava_athlete_id, distance_unit)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'testuser@example.com',
  12345678,
  'km'
) on conflict (id) do nothing;

-- Create bikes
insert into public.bikes (id, user_id, name, strava_gear_id, is_active) values
  ('b0000000-0000-0000-0000-000000000b01', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Canyon Endurace', 'b1234567', true),
  ('b0000000-0000-0000-0000-000000000b02', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Trek Fuel EX', 'b7654321', true)
on conflict (id) do nothing;

-- Create components on road bike
insert into public.components (id, bike_id, name, type, max_distance_km, installed_at) values
  ('c0000000-0000-0000-0000-0000000000c1', 'b0000000-0000-0000-0000-000000000b01', 'Shimano CN-HG701', 'chain', 5000, '2026-01-01'),
  ('c0000000-0000-0000-0000-0000000000c2', 'b0000000-0000-0000-0000-000000000b01', 'Shimano CS-R8100', 'cassette', 15000, '2026-01-01'),
  ('c0000000-0000-0000-0000-0000000000c3', 'b0000000-0000-0000-0000-000000000b01', 'Continental GP5000', 'tire_front', 8000, '2026-01-01'),
  ('c0000000-0000-0000-0000-0000000000c4', 'b0000000-0000-0000-0000-000000000b01', 'Continental GP5000', 'tire_rear', 6000, '2026-01-01')
on conflict (id) do nothing;

-- Create components on MTB
insert into public.components (id, bike_id, name, type, max_distance_km, installed_at) values
  ('c0000000-0000-0000-0000-0000000000c5', 'b0000000-0000-0000-0000-000000000b02', 'SRAM GX Eagle', 'chain', 3000, '2026-01-01'),
  ('c0000000-0000-0000-0000-0000000000c6', 'b0000000-0000-0000-0000-000000000b02', 'Maxxis Minion DHF', 'tire_front', 4000, '2026-01-01')
on conflict (id) do nothing;

-- Create sample rides
insert into public.rides (id, user_id, bike_id, strava_activity_id, name, distance_km, moving_time_seconds, started_at) values
  ('d0000000-0000-0000-0000-000000000d01', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b0000000-0000-0000-0000-000000000b01', 100001, 'Morning Road Ride', 52.3, 5400, '2026-01-15 08:00:00+00'),
  ('d0000000-0000-0000-0000-000000000d02', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b0000000-0000-0000-0000-000000000b01', 100002, 'Evening Loop', 35.1, 3600, '2026-01-20 17:00:00+00'),
  ('d0000000-0000-0000-0000-000000000d03', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b0000000-0000-0000-0000-000000000b02', 100003, 'Trail Session', 28.7, 7200, '2026-02-01 10:00:00+00')
on conflict (id) do nothing;

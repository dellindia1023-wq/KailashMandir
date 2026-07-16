-- Migration: create about_settings table and seed initial row
-- Generated: 2026-07-10

create extension if not exists pgcrypto;

-- Table to store About page editable content managed by admin UI
create table if not exists public.about_settings (
  id uuid primary key default gen_random_uuid(),
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  trust_committee jsonb,
  head_priests jsonb,
  rituals jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed a single default row if none exists
do $$
begin
  if not exists (select 1 from public.about_settings) then
    insert into public.about_settings (id, hero_title, hero_subtitle, hero_image_url, trust_committee, head_priests, rituals)
    values (
      gen_random_uuid(),
      'Kailash Mahadev Temple, Agra',
      'Sacred twin Shivlings & centuries of devotion',
      'https://vgqqcafrkydpothcvtan.supabase.co/storage/v1/object/public/content/defaults/about-hero.jpg',
      '[{"name":"Mahant Ramdas","role":"Chair","photo":"https://vgqqcafrkydpothcvtan.supabase.co/storage/v1/object/public/content/defaults/mahant.jpg","bio":"Temple chair and community leader."}]'::jsonb,
      '[{"name":"Pt. Ramesh Sharma","designation":"Head Priest","photo":"https://vgqqcafrkydpothcvtan.supabase.co/storage/v1/object/public/content/defaults/priest1.jpg","bio":"Performs daily rituals and aartis."}]'::jsonb,
      '[{"title":"Daily Aarti","description":"Morning and evening aarti timings."}]'::jsonb
    );
  end if;
end$$;

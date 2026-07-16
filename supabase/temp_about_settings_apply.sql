create extension if not exists pgcrypto;

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

alter table if exists public.about_settings enable row level security;

drop policy if exists "about_select" on public.about_settings;
drop policy if exists "about_insert_admins" on public.about_settings;
drop policy if exists "about_update_admins" on public.about_settings;
drop policy if exists "about_delete_admins" on public.about_settings;

create policy "about_select" on public.about_settings for select using (true);
create policy "about_insert_admins" on public.about_settings for insert with check (
  has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'super_admin'::app_role)
);
create policy "about_update_admins" on public.about_settings for update
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'super_admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'super_admin'::app_role));
create policy "about_delete_admins" on public.about_settings for delete
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'super_admin'::app_role));

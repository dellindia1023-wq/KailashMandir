create extension if not exists pgcrypto;

create table if not exists public.puja_completion_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.puja_bookings(id) on delete cascade,
  completion_notes text,
  completed_at timestamptz,
  prasad_dispatch_status text not null default 'pending' check (prasad_dispatch_status in ('pending','packed','dispatched','delivered')),
  courier_tracking_number text,
  certificate_url text,
  approval_status text not null default 'draft' check (approval_status in ('draft','pending','approved','rejected','needs_revision')),
  approval_required boolean not null default true,
  admin_notes text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.puja_completion_media (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null references public.puja_completion_records(id) on delete cascade,
  media_type text not null check (media_type in ('photo','video','certificate')),
  url text not null,
  caption text,
  approval_status text not null default 'pending' check (approval_status in ('draft','pending','approved','rejected','needs_revision')),
  is_hidden boolean not null default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.puja_completion_settings (
  id uuid primary key default gen_random_uuid(),
  approval_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.puja_completion_settings (approval_required, updated_at)
select false, now()
where not exists (select 1 from public.puja_completion_settings);

alter table public.puja_completion_records enable row level security;
alter table public.puja_completion_media enable row level security;
alter table public.puja_completion_settings enable row level security;

create policy "Users can view completion records for their own bookings"
  on public.puja_completion_records for select
  using (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_bookings pb where pb.id = puja_completion_records.booking_id and pb.user_id = auth.uid()
      ) or exists (
        select 1 from public.puja_bookings pb where pb.id = puja_completion_records.booking_id and pb.assigned_priest_id = auth.uid()
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  );

create policy "Priests and admins can manage completion records"
  on public.puja_completion_records for insert
  with check (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_bookings pb where pb.id = puja_completion_records.booking_id and pb.assigned_priest_id = auth.uid()
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  );

create policy "Priests and admins can update completion records"
  on public.puja_completion_records for update
  using (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_bookings pb where pb.id = puja_completion_records.booking_id and pb.assigned_priest_id = auth.uid()
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  )
  with check (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_bookings pb where pb.id = puja_completion_records.booking_id and pb.assigned_priest_id = auth.uid()
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  );

create policy "Users can view completion media for their own bookings"
  on public.puja_completion_media for select
  using (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_completion_records pcr
        join public.puja_bookings pb on pb.id = pcr.booking_id
        where pcr.id = puja_completion_media.completion_id and (
          pb.user_id = auth.uid() or pb.assigned_priest_id = auth.uid()
        )
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  );

create policy "Priests and admins can manage completion media"
  on public.puja_completion_media for insert
  with check (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_completion_records pcr
        join public.puja_bookings pb on pb.id = pcr.booking_id
        where pcr.id = puja_completion_media.completion_id and pb.assigned_priest_id = auth.uid()
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  );

create policy "Priests and admins can update completion media"
  on public.puja_completion_media for update
  using (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_completion_records pcr
        join public.puja_bookings pb on pb.id = pcr.booking_id
        where pcr.id = puja_completion_media.completion_id and pb.assigned_priest_id = auth.uid()
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  )
  with check (
    auth.uid() is not null and (
      exists (
        select 1 from public.puja_completion_records pcr
        join public.puja_bookings pb on pb.id = pcr.booking_id
        where pcr.id = puja_completion_media.completion_id and pb.assigned_priest_id = auth.uid()
      ) or exists (
        select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
      )
    )
  );

create policy "Admins can manage completion settings"
  on public.puja_completion_settings for select
  using (
    auth.uid() is not null and exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
    )
  );

create policy "Admins can update completion settings"
  on public.puja_completion_settings for update
  using (
    auth.uid() is not null and exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
    )
  )
  with check (
    auth.uid() is not null and exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
    )
  );

insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do nothing;

create policy "Public content can be selected"
  on storage.objects for select
  using (bucket_id = 'content');

create policy "Authenticated users can upload content"
  on storage.objects for insert
  with check (bucket_id = 'content' and auth.role() = 'authenticated');

create policy "Authenticated users can update content"
  on storage.objects for update
  using (bucket_id = 'content' and auth.role() = 'authenticated')
  with check (bucket_id = 'content' and auth.role() = 'authenticated');

create policy "Authenticated users can delete content"
  on storage.objects for delete
  using (bucket_id = 'content' and auth.role() = 'authenticated');

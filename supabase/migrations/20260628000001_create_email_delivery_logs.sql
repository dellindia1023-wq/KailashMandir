create table if not exists public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  template_name text not null,
  recipient text not null,
  subject text,
  status text not null check (status in ('sent', 'failed')),
  provider text not null default 'resend',
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.email_delivery_logs enable row level security;

drop policy if exists "service_role_can_manage_email_delivery_logs" on public.email_delivery_logs;

create policy "service_role_can_manage_email_delivery_logs"
  on public.email_delivery_logs
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

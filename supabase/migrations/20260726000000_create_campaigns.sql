-- Create campaigns table for dynamic campaign and promotion management
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  type text,
  status text not null default 'draft',
  priority int not null default 100,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean not null default true,
  locations jsonb not null default '[]',
  targeting_rules jsonb not null default '{}',
  content jsonb not null default '{}',
  ctas jsonb not null default '[]',
  analytics jsonb not null default '{"impressions":0,"clicks":0,"conversions":0,"donation_amount":0,"booking_count":0}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_status on campaigns (status);
create index if not exists idx_campaigns_start_date on campaigns (start_date);
create index if not exists idx_campaigns_end_date on campaigns (end_date);

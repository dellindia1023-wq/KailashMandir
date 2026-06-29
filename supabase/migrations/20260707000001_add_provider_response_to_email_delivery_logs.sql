alter table public.email_delivery_logs
  add column if not exists provider_response text;

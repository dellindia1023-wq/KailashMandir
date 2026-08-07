alter table public.campaigns enable row level security;

drop policy if exists "campaigns_public_read" on public.campaigns;
drop policy if exists "campaigns_admin_manage" on public.campaigns;

create policy "campaigns_public_read"
on public.campaigns
for select
using (true);

create policy "campaigns_admin_manage"
on public.campaigns
for all
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'super_admin')
  )
);

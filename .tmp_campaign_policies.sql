drop policy if exists "Allow admins to manage campaigns" on public.campaigns;
drop policy if exists "Allow authenticated users to read campaigns" on public.campaigns;

create policy "Allow admins to manage campaigns"
on public.campaigns
for all
using (
  auth.uid() is not null and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin','super_admin')
  )
)
with check (
  auth.uid() is not null and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin','super_admin')
  )
);

create policy "Allow authenticated users to read campaigns"
on public.campaigns
for select
using (auth.uid() is not null);

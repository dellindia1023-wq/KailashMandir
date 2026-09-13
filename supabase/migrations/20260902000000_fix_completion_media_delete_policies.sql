create policy "Admins can delete completion media"
  on public.puja_completion_media for delete
  using (
    auth.uid() is not null and exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
    )
  );

create policy "Admins can delete completion records"
  on public.puja_completion_records for delete
  using (
    auth.uid() is not null and exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
    )
  );

create policy "Admins can delete content objects"
  on storage.objects for delete
  using (
    bucket_id = 'content' and auth.uid() is not null and exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','super_admin')
    )
  );

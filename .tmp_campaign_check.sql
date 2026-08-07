select id, name, slug, status, updated_at from public.campaigns where slug like 'smoke-crud%' order by created_at desc;

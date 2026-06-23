-- Verify and insert default categories if they don't exist
INSERT INTO public.blog_categories (name, slug, description)
SELECT 'Spiritual Insights', 'spiritual-insights', 'Spiritual teachings and wisdom'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_categories WHERE slug = 'spiritual-insights');

INSERT INTO public.blog_categories (name, slug, description)
SELECT 'Temple Updates', 'temple-updates', 'News and updates from the temple'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_categories WHERE slug = 'temple-updates');

INSERT INTO public.blog_categories (name, slug, description)
SELECT 'Rituals & Traditions', 'rituals-traditions', 'Information about temple rituals'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_categories WHERE slug = 'rituals-traditions');

INSERT INTO public.blog_categories (name, slug, description)
SELECT 'Events', 'events', 'Upcoming events and celebrations'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_categories WHERE slug = 'events');

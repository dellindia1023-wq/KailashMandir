# SEO Update TODO

## Step 1 — Create Social page
- [ ] Add `src/pages/SocialPostsPage.tsx` route `/social`
- [ ] Add `<SEOHead />` with target keywords (Kailash Mahadev Agra variants + Social)
- [ ] Embed/Render Instagram + Facebook + YouTube content on-page in the browser
- [ ] Add Organization JSON-LD with `sameAs` links

## Step 2 — Add route
- [ ] Update `src/main.tsx` to include `/social`

## Step 3 — Update footer navigation
- [ ] Update `src/components/Footer.tsx` to link to `/social`

## Step 4 — Improve SEO for key pages (no breaking changes)
- [ ] Update `src/pages/Index.tsx` SEOHead props: title/description/keywords (add Kailash Mahadev Agra variants)
- [ ] Update `src/pages/AboutPage.tsx` SEOHead props similarly
- [ ] Update `src/pages/ContactPage.tsx` SEOHead props similarly
- [ ] Update `src/pages/DarshanTimingsPage.tsx` SEOHead props similarly
- [ ] Update `src/pages/DonatePage.tsx` SEOHead props similarly
- [ ] Update `src/pages/Events.tsx` SEOHead props similarly

## Step 5 — Quick validation
- [ ] Open each route in browser and verify meta tags (title/description/canonical/og/twitter)
- [ ] Confirm `/social` shows embedded social feeds

---

# Razorpay (Test) Setup TODO

## Step 1 — Configure Supabase Edge Function secrets (Dashboard)
- [ ] Set `RAZORPAY_KEY_ID` = `rzp_test_SlxOCu3aheytI7` for the Edge Functions
- [ ] Set `RAZORPAY_KEY_SECRET` for the Edge Functions

## Step 2 — Confirm secrets are used by these functions
- [ ] `supabase/functions/create-razorpay-order` uses `RAZORPAY_KEY_ID/SECRET`
- [ ] `supabase/functions/verify-razorpay-payment` uses `RAZORPAY_KEY_SECRET`
- [ ] `supabase/functions/create-donation-order` uses `RAZORPAY_KEY_ID/SECRET`
- [ ] `supabase/functions/verify-donation-payment` uses `RAZORPAY_KEY_SECRET`

## Step 3 — Test end-to-end (Donation)
- [ ] Open `DonatePage` and create a Razorpay order
- [ ] Complete Razorpay test payment
- [ ] Verify `donations.status` becomes `completed` after verification


// Simple script to insert a test campaign using Supabase JS client
// Usage: Set env vars VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY), then run:
// node scripts/insert_test_campaign.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const now = new Date().toISOString();
  const payload = {
    name: 'Test Campaign (automated)',
    slug: `test-campaign-${Date.now()}`,
    description: 'Inserted by test script',
    type: 'Test',
    status: 'running',
    priority: 50,
    start_date: now,
    end_date: null,
    is_active: true,
    locations: ['homepage.hero'],
    targeting_rules: { page_types: ['home'], logged_in: 'any' },
    content: { headline: 'Test Headline', message: 'This is a test campaign.' },
    ctas: [{ id: 'cta-1', label: 'Learn More', url: '/', type: 'link' }],
    analytics: { impressions: 0, clicks: 0, conversions: 0, donation_amount: 0, booking_count: 0 },
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase.from('campaigns').insert(payload).select();
    if (error) {
      console.error('Insert error:', error);
      process.exit(2);
    }
    console.log('Inserted campaign:', data && data[0] ? data[0] : data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(3);
  }
}

run();

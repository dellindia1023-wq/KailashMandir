const SERVICE_ROLE_KEY = '6d895147be6cde52da050c907e342c27f8bac934b2cd3092983c7bd139f4b583';
const ANON_KEY = 'f0198970e6e71860726e2e92858ee43c5b27329de0776049067aa649b239736d';
const URL = 'https://vgqqcafrkydpothcvtan.supabase.co/functions/v1/send-booking-email';
const payload = { bookingId: 'e8e2c61a-3dc9-40a5-b668-e688c75c854e', type: 'confirmation' };
const headerSets = [
  { 'x-service-role-key': SERVICE_ROLE_KEY },
  { 'x-supabase-service-role': SERVICE_ROLE_KEY },
  { 'x-send-booking-email-key': SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'x-service-role-key': SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'x-supabase-service-role': SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'x-send-booking-email-key': SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
  { apikey: SERVICE_ROLE_KEY },
  { apikey: ANON_KEY },
  { 'x-api-key': SERVICE_ROLE_KEY },
  { 'x-api-key': ANON_KEY },
  { 'x-supabase-api-key': SERVICE_ROLE_KEY },
  { 'x-supabase-api-key': ANON_KEY },
];

const run = async () => {
  for (const headers of headerSets) {
    console.log('--- Headers:', Object.keys(headers).join(', '));
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch (err) { json = text; }
    console.log('status', res.status);
    console.log(json);
  }
};

run().catch(err => { console.error(err); process.exit(1); });
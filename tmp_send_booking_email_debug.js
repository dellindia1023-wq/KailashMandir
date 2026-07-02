const SERVICE_ROLE_KEY = '6d895147be6cde52da050c907e342c27f8bac934b2cd3092983c7bd139f4b583';
const URL = 'https://vgqqcafrkydpothcvtan.supabase.co/functions/v1/send-booking-email';
const payload = { bookingId: 'e8e2c61a-3dc9-40a5-b668-e688c75c854e', type: 'confirmation' };
const headerSets = [
  { 'x-service-role-key': SERVICE_ROLE_KEY },
  { 'x-supabase-service-role': SERVICE_ROLE_KEY },
  { 'x-send-booking-email-key': SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'x-service-role-key': SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'x-supabase-service-role': SERVICE_ROLE_KEY },
  { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'x-send-booking-email-key': SERVICE_ROLE_KEY },
];

const run = async () => {
  for (const headers of headerSets) {
    console.log('---');
    console.log('Headers:', Object.keys(headers).join(', '));
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

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

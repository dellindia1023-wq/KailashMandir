const SUPABASE_URL = 'https://vgqqcafrkydpothcvtan.supabase.co';
const SERVICE_ROLE_KEY = '6d895147be6cde52da050c907e342c27f8bac934b2cd3092983c7bd139f4b583';

const bookingPayload = {
  bookingId: 'e8e2c61a-3dc9-40a5-b668-e688c75c854e',
  type: 'confirmation',
};

const post = async (url, headers, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (err) { json = { parseError: err.message, text }; }
  return { status: res.status, json };
};

const tryHeaders = async () => {
  const url = `${SUPABASE_URL}/functions/v1/send-booking-email`;
  const headerSets = [
    { 'x-service-role-key': SERVICE_ROLE_KEY },
    { 'x-supabase-service-role': SERVICE_ROLE_KEY },
    { 'x-send-booking-email-key': SERVICE_ROLE_KEY },
    { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'x-service-role-key': SERVICE_ROLE_KEY },
  ];

  for (const headers of headerSets) {
    console.log('Trying headers:', Object.keys(headers).join(', '));
    const result = await post(url, headers, bookingPayload);
    console.log('status', result.status);
    console.log(JSON.stringify(result.json, null, 2));
  }
};

const run = async () => {
  await tryHeaders();
};

run().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

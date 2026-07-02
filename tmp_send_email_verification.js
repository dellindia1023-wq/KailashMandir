const fetch = globalThis.fetch;
const SUPABASE_URL = 'https://vgqqcafrkydpothcvtan.supabase.co';
const SERVICE_ROLE_KEY = '6d895147be6cde52da050c907e342c27f8bac934b2cd3092983c7bd139f4b583';
const RESEND_API_KEY = '25d351124b6f8126921e74d5653836791e8801b6d9d6c9f0a7a7f1ebeafe03be';

const welcomePayload = {
  email: 'priyanshugautamji0001@gmail.com',
  fullName: 'Priyanshu Gautam',
};

const bookingPayload = {
  bookingId: 'e8e2c61a-3dc9-40a5-b668-e688c75c854e',
  type: 'confirmation',
};

const requestOptions = (body) => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-service-role-key': SERVICE_ROLE_KEY,
  },
  body: JSON.stringify(body),
});

const sendWelcome = async () => {
  console.log('Invoking send-welcome-email...');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, requestOptions(welcomePayload));
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    json = { parseError: err.message, text };
  }
  console.log('send-welcome-email status', res.status);
  console.log(JSON.stringify(json, null, 2));
  return json;
};

const sendBookingConfirmation = async () => {
  console.log('Invoking send-booking-email...');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-booking-email`, requestOptions(bookingPayload));
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    json = { parseError: err.message, text };
  }
  console.log('send-booking-email status', res.status);
  console.log(JSON.stringify(json, null, 2));
  return json;
};

const queryEmailLogs = async () => {
  console.log('Querying latest email_delivery_logs...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/email_delivery_logs?select=*&order=created_at.desc&limit=10`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      Accept: 'application/json',
    },
  });
  const json = await res.json();
  console.log('email_delivery_logs rows:', json.length);
  console.log(JSON.stringify(json, null, 2));
  return json;
};

const verifyResendEmail = async (id) => {
  console.log('Verifying Resend email id:', id);
  const res = await fetch(`https://api.resend.com/emails/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      Accept: 'application/json',
    },
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
  return json;
};

const run = async () => {
  const welcomeResult = await sendWelcome();
  const bookingResult = await sendBookingConfirmation();

  const logs = await queryEmailLogs();
  const welcomeId = welcomeResult?.result?.id || welcomeResult?.id;
  const bookingId = bookingResult?.emailId || bookingResult?.id || bookingResult?.result?.id;

  if (welcomeId) {
    await verifyResendEmail(welcomeId);
  } else {
    console.log('No welcome message id returned.');
  }

  if (bookingId) {
    await verifyResendEmail(bookingId);
  } else {
    console.log('No booking message id returned.');
  }
};

run().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});

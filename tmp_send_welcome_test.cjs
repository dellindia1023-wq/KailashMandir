const { createClient } = require('./node_modules/@supabase/supabase-js/dist/index.cjs');
const url = 'https://vgqqcafrkydpothcvtan.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncXFjYWZya3lkcG90aGN2dGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjg4NzgsImV4cCI6MjA5NzMwNDg3OH0.kS_S-EP0Bml_X7kampNYyGiKAn1bkscIMenDtFo5vgk';
const supabase = createClient(url, key);

(async () => {
  try {
    const email = `resend-test-welcome-${Date.now()}@kailashmahadevtemple.com`;
    const password = 'Test1234!';
    console.log('signup', email);

    const { data: signupData, error: signupError } = await supabase.auth.signUp({ email, password });
    console.log('signupError', signupError);
    console.log('signupData', JSON.stringify(signupData));

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    console.log('signInError', signInError);
    console.log('signInData', JSON.stringify(signInData));

    if (!signInError && signInData?.session?.access_token) {
      const accessToken = signInData.session.access_token;
      console.log('accessToken', accessToken?.slice(0, 40) + '...');

      const response = await fetch('https://vgqqcafrkydpothcvtan.functions.supabase.co/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: key,
        },
        body: JSON.stringify({ email, fullName: 'Test Devotee' }),
      });

      console.log('fn status', response.status);
      console.log('fn body', await response.text());
    }
  } catch (error) {
    console.error('fatal', error);
    process.exit(1);
  }
})();

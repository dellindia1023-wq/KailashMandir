const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
for (const line of fs.readFileSync('.env','utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^['\"]|['\"]$/g,'');
}
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
(async () => {
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'superadmin@kailash.com', password: 'Super@@1618' });
  console.log(JSON.stringify({ data: data ? { userId: data.user?.id, accessToken: !!data.session?.access_token } : null, error: error ? { message: error.message, status: error.status } : null }, null, 2));
})();

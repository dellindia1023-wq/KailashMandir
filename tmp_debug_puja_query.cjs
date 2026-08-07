const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = envContent.split(/\r?\n/).reduce((acc, line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) acc[m[1].trim()] = m[2].replace(/^"|"$/g, '').trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY);
(async () => {
  try {
    console.log('URL', env.VITE_SUPABASE_URL);
    const { data, error, count } = await supabase.from('pujas').select('id,name,is_active,active,category,price', { count: 'exact' });
    console.log('error', JSON.stringify(error));
    console.log('count', count);
    console.log('rows', JSON.stringify((data || []).slice(0, 50), null, 2));
    const { data: visible, error: err2 } = await supabase.from('pujas').select('id,name,is_active,active,category,price').or('is_active.eq.true,active.eq.true');
    console.log('visible error', JSON.stringify(err2));
    console.log('visible count', (visible || []).length);
    console.log('visible rows', JSON.stringify((visible || []).slice(0, 50), null, 2));
  } catch (err) {
    console.error('unexpected', err);
  }
})();
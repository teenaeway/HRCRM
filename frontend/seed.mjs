import { createClient } from '@supabase/supabase-js';

// Paste your service_role key here
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient('https://pmbnvrrwbvtcwxeiklpd.supabase.co', SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  // Using the admin API bypasses rate limits and forces email_confirm to true
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'dummyadmin2@gmail.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'admin', name: 'Dummy Admin' }
  });
 
  if (error) { 
    console.error('Error signing up admin:', error);
  } else {
    console.log('Success! Admin created with User ID:', data?.user?.id);
  }
  // else{""}
}

run();

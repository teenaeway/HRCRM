import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://emqgcaapixqtrozggtrp.supabase.co', 'sb_publishable_Ftcv_DZA8mjN94K_AECEBw_tkCfdSZR');

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'tanishqray65617@gmail.com',
    password: 'password123',
    options: { data: { role: 'admin', name: 'Admin' } }
  });
  console.log(error ? 'Error: ' + error.message : 'Success: ' + data?.user?.id);
}
run();

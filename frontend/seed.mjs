import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://pmbnvrrwbvtcwxeiklpd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYm52cnJ3YnZ0Y3d4ZWlrbHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODk4NjQsImV4cCI6MjA5ODM2NTg2NH0.ZUNLIpzGTmMQRmjZrWunER-t-BX5VcU1qaLCUFOjlf8');

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'dummyadmin@gmail.com',
    password: 'password123',
    options: { data: { role: 'admin', name: 'Dummy Admin' } }
  });
  if (error) {
    console.error('Error signing up admin:', error);
  } else {
    console.log('Success signing up admin! User ID:', data?.user?.id);
  }
}
run();

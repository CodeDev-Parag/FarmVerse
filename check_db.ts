import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllProducts() {
  const { data: p, error } = await supabase.from('products').select('*');
  if (p) {
    console.log('All products:', JSON.stringify(p, null, 2));
  } else {
    console.log('Error:', error);
  }
}
checkAllProducts();

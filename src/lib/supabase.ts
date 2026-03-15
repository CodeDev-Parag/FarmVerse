import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key when ready
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

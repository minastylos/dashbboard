import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pthjoefznifyymzsfasi.supabase.co';
const supabaseAnonKey = 'sb_publishable_yfh35uc-dVaAvJcs_iTYmg_hwkwPOwY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

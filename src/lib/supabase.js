import { createClient } from '@supabase/supabase-js';

// Essas informações você obtém ao criar um projeto no Supabase (supabase.com)
// Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-aqui.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'SUA_CHAVE_ANON_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

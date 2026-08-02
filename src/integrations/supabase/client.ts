import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { supabaseConfig, hasSupabaseConfig } from '@/config/env';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
//
// A anon key é pública por design (protegida por RLS), mas fica fora do
// código-fonte: vem de VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.

if (!hasSupabaseConfig) {
  console.warn(
    '[APEX CONFIG] Supabase não configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes).'
  );
}

export const supabase = createClient<Database>(
  supabaseConfig.url || 'http://localhost',
  supabaseConfig.anonKey || 'public-anon-key-missing'
);

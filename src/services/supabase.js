import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_PROJECT_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "@/config/supabase";

const demo = import.meta.env.VITE_DATA_MODE === "demo";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  SUPABASE_PUBLISHABLE_KEY;

// La demostración es explícita: una falla de red nunca reemplaza los datos reales
// por ejemplos locales ni cambia la autenticación a roles simulados.
export const supabase = demo
  ? null
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
export const supabaseConfigurado = () => supabase !== null;

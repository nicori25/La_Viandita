import { createClient } from '@supabase/supabase-js'

// Lee las variables de entorno (VITE_* están expuestas al cliente en Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si no hay variables configuradas, devuelve null (modo datos de prueba)
let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

export const supabaseConfigurado = () => supabase !== null

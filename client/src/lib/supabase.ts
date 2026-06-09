import { createClient } from "@supabase/supabase-js";

// ─── Estas variables van en tu archivo .env.local (desarrollo) ───
// y en el panel de Netlify > Site Settings > Environment Variables (producción)
//
//   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
//
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. " +
    "La app usará localStorage como fallback hasta que las configures."
  );
}

export const supabase = createClient(
  SUPABASE_URL      || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-key",
  {
    auth: { persistSession: true, autoRefreshToken: true },
  }
);

// ─── Helpers de storage ───────────────────────────────────────────
export const BUCKET = "galaxy-photos";

/** Devuelve la URL pública de un archivo en el bucket */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** ¿Supabase está configurado? (vars presentes y no placeholder) */
export function isSupabaseConfigured(): boolean {
  return (
    !!import.meta.env.VITE_SUPABASE_URL &&
    !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes("placeholder")
  );
}

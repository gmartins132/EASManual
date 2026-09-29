import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabaseBrowser = createClient(url, publishableKey, {
  auth: { persistSession: false },
});

export const DOCUMENTOS_BUCKET = "documentos";

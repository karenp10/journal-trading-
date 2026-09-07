// ============================================================
//  supabase.js — Conexión con Supabase
//  Estos dos valores son PÚBLICOS (van en el frontend). No son secretos.
//  Requiere cargar antes la librería por CDN en el HTML:
//  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// ============================================================

const SUPABASE_URL = "https://fujpyzebrxzboxirtjem.supabase.co";
const SUPABASE_KEY = "sb_publishable_UtkvwRST222Zv6h7-QfvpA_CYD_gGk5";

// Cliente global que usan los demás archivos (auth.js, registro.js, etc.)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

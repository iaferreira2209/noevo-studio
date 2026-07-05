// ==========================================================
// Configuração do Supabase (NOEVO STUDIO)
// ==========================================================
// URL e chave publicável do projeto Supabase.
// A "publishable key" é segura para ficar no código do site:
// o acesso real aos dados é controlado pelas regras (RLS)
// configuradas no banco, não por essa chave.
const SUPABASE_URL = "https://nmyiuqitfdzcevqwgutr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oE-adanbl76ePDk45PvMIQ_dV4U3WXp";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

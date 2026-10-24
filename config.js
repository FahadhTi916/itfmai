// Public browser config only. Supabase anon/publishable key is intended for browser use.
// Never place ITFM_AI_API_KEY, TMDB_API_KEY, service-role keys, or worker secrets here.
window.ITFM_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  functionsBaseUrl: "https://YOUR_PROJECT.supabase.co/functions/v1",
  tmdbImageBaseUrl: "https://image.tmdb.org/t/p/w500"
};

// Vercel serverless API: secrets remain server-side.
export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS'); return res.status(204).end(); }
  try {
    if (path === 'health') return res.status(200).json({ok:true, services:{tmdb:!!process.env.TMDB_API_KEY, openrouter:!!process.env.OPENROUTER_API_KEY, genjutsu:!!process.env.GENJUTSU_API_URL}});
    if (path === 'tmdb') {
      if (!process.env.TMDB_API_KEY) return res.status(503).json({error:'TMDB_API_KEY is not configured. Add a TMDB v3 API key in Vercel Environment Variables.'});
      const p = new URLSearchParams(url.searchParams); const route = p.get('route') || 'trending/movie/week'; p.delete('route');
      const target = new URL('https://api.themoviedb.org/3/' + route.replace(/^\/+/, ''));
      for (const [k,v] of p) target.searchParams.set(k,v);
      target.searchParams.set('api_key',process.env.TMDB_API_KEY);
      const r = await fetch(target); const data = await r.json();
      return res.status(r.status).json(data);
    }
    if (path === 'chat' && req.method === 'POST') {
      if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({error:'AI chat is not configured. Set OPENROUTER_API_KEY. A free model may be selected in the request.'});
      const body = req.body || {}; const model = body.model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json','HTTP-Referer':process.env.APP_URL || 'https://localhost','X-Title':'ITFM AI'},body:JSON.stringify({model,messages:body.messages || [{role:'user',content:String(body.message||'')}],temperature:0.7})});
      const data=await r.json(); return res.status(r.status).json(data);
    }
    if (path === 'genjutsu') {
      if (!process.env.GENJUTSU_API_URL || !process.env.GENJUTSU_API_KEY) return res.status(503).json({error:'No verified public Genjutsu AI API configuration found. Set GENJUTSU_API_URL and GENJUTSU_API_KEY only if you have official provider documentation.'});
      return res.status(501).json({error:'Genjutsu endpoint schema is provider-specific. Integration intentionally disabled until official request/response documentation is supplied.'});
    }
    return res.status(404).json({error:'Unknown API route'});
  } catch (e) { return res.status(500).json({error:'Service request failed',detail: process.env.NODE_ENV === 'development' ? e.message : undefined}); }
}
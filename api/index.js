// ITFM AI serverless API router for Vercel (Node.js runtime).
// Secrets stay on the server; never expose provider keys to browser code.
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
function reply(res, status, body) { res.writeHead(status, headers); res.end(JSON.stringify(body)); }
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error("Request too large (max 1 MB)."); }
  return raw ? JSON.parse(raw) : {};
}
module.exports = async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname.replace(/^\/api\/?/, "");
  try {
    // Validate a client-owned ITFM AI key (for testing and future API gateway middleware).
    if (req.method === "GET" && path === "key/verify") {
      const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      const rawKey = String(req.headers["x-itfm-api-key"] || "");
      if (!supabaseUrl || !serviceKey) return reply(res, 503, { error: "Key validation is not configured on the server." });
      if (!/^itfm_live_[a-f0-9]{64}$/.test(rawKey)) return reply(res, 401, { valid: false, error: "Provide a valid ITFM AI key using the X-ITFM-API-Key header." });
      const crypto = require("crypto");
      const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
      const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
      const tableUrl = `${supabaseUrl}/rest/v1/itfm_api_keys`;
      const r = await fetch(`${tableUrl}?key_hash=eq.${hash}&revoked_at=is.null&select=id,name,user_id`, { headers: dbHeaders });
      const rows = await r.json().catch(() => []);
      if (!r.ok) return reply(res, 502, { error: "Could not validate key. Check the database schema." });
      if (!rows.length) return reply(res, 401, { valid: false, error: "Key is invalid or revoked." });
      await fetch(`${tableUrl}?id=eq.${encodeURIComponent(rows[0].id)}`, { method: "PATCH", headers: { ...dbHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ last_used_at: new Date().toISOString() }) }).catch(() => {});
      return reply(res, 200, { valid: true, name: rows[0].name, key_id: rows[0].id });
    }

    // User-owned ITFM AI keys. Requires Supabase Auth + database configuration.
    if (path === "keys" && ["GET", "POST", "DELETE"].includes(req.method)) {
      const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
      const anonKey = process.env.SUPABASE_ANON_KEY || "";
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      if (!supabaseUrl || !anonKey || !serviceKey) return reply(res, 503, { error: "API key management is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY on the server, then run supabase/schema.sql." });
      const auth = String(req.headers.authorization || "");
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!token) return reply(res, 401, { error: "Sign in first. A Supabase access token is required." });
      const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
      const user = await userResp.json().catch(() => ({}));
      if (!userResp.ok || !user.id) return reply(res, 401, { error: "Your session is invalid or expired. Please sign in again." });
      const dbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
      const tableUrl = `${supabaseUrl}/rest/v1/itfm_api_keys`;
      if (req.method === "GET") {
        const r = await fetch(`${tableUrl}?user_id=eq.${encodeURIComponent(user.id)}&revoked_at=is.null&select=id,name,key_prefix,created_at,last_used_at&order=created_at.desc`, { headers: dbHeaders });
        const rows = await r.json().catch(() => []);
        if (!r.ok) return reply(res, 502, { error: "Could not load keys. Check the database schema and Supabase configuration." });
        return reply(res, 200, { keys: rows });
      }
      if (req.method === "POST") {
        const body = await readBody(req);
        const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
        if (!name) return reply(res, 400, { error: "Provide a name for this API key." });
        const existingResp = await fetch(`${tableUrl}?user_id=eq.${encodeURIComponent(user.id)}&revoked_at=is.null&select=id`, { headers: dbHeaders });
        const existing = await existingResp.json().catch(() => []);
        if (!existingResp.ok) return reply(res, 502, { error: "Could not check API key quota. Verify the database schema." });
        if (existing.length >= 10) return reply(res, 429, { error: "Maximum 10 active API keys per account." });
        const crypto = require("crypto");
        const rawKey = `itfm_live_${crypto.randomBytes(32).toString("hex")}`;
        const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
        const keyPrefix = rawKey.slice(0, 18);
        const r = await fetch(`${tableUrl}?select=id,name,key_prefix,created_at`, { method: "POST", headers: { ...dbHeaders, Prefer: "return=representation" }, body: JSON.stringify({ user_id: user.id, name, key_hash: keyHash, key_prefix: keyPrefix }) });
        const rows = await r.json().catch(() => []);
        if (!r.ok) return reply(res, 502, { error: "Could not save API key. Check that supabase/schema.sql has been applied." });
        return reply(res, 201, { key: rawKey, record: rows[0], warning: "Copy this key now. It is shown only once; only its hash is stored." });
      }
      const body = await readBody(req);
      const id = typeof body.id === "string" ? body.id : new URL(req.url, "http://localhost").searchParams.get("id");
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return reply(res, 400, { error: "A valid API key id is required." });
      const r = await fetch(`${tableUrl}?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&revoked_at=is.null`, { method: "PATCH", headers: { ...dbHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
      if (!r.ok) return reply(res, 502, { error: "Could not revoke API key." });
      return reply(res, 200, { revoked: true });
    }

    if (req.method === "GET" && path === "health") {
      return reply(res, 200, { name: "ITFM AI API", status: "ok", configured: {
        chat: Boolean(process.env.ITFM_AI_API_KEY && process.env.ITFM_AI_BASE_URL),
        tmdb: Boolean(process.env.TMDB_API_KEY),
        iptv: true,
        generation: Boolean(process.env.ITFM_AI_API_KEY && process.env.ITFM_AI_BASE_URL)
      }, note: "Status indicates configuration only; provider connectivity is verified on request." });
    }

    if (req.method === "POST" && path === "chat") {
      const { message, history = [] } = await readBody(req);
      if (typeof message !== "string" || !message.trim()) return reply(res, 400, { error: "message is required." });
      if (!process.env.ITFM_AI_API_KEY || !process.env.ITFM_AI_BASE_URL) return reply(res, 503, { error: "AI chat is not configured. Set ITFM_AI_BASE_URL and ITFM_AI_API_KEY in Vercel Environment Variables. Use a provider endpoint that supports the OpenAI Chat Completions format." });
      const base = process.env.ITFM_AI_BASE_URL.replace(/\/+$/, "");
      const endpoint = /\/chat\/completions$/.test(base) ? base : `${base}/chat/completions`;
      const messages = [];
      for (const item of Array.isArray(history) ? history.slice(-12) : []) {
        if (item && ["user","assistant"].includes(item.role) && typeof item.content === "string") messages.push({role:item.role,content:item.content.slice(0,8000)});
      }
      messages.push({ role: "user", content: message.slice(0, 12000) });
      const upstream = await fetch(endpoint, { method:"POST", headers:{"Authorization":`Bearer ${process.env.ITFM_AI_API_KEY}`,"Content-Type":"application/json"}, body:JSON.stringify({model:process.env.ITFM_AI_MODEL || "default",messages,temperature:0.7}) });
      const data = await upstream.json().catch(()=>({}));
      if (!upstream.ok) return reply(res, upstream.status, { error: data.error?.message || data.message || `AI provider returned HTTP ${upstream.status}.` });
      return reply(res, 200, { reply: data.choices?.[0]?.message?.content || data.output_text || data.reply || "Provider responded, but its response format was not recognized.", provider: "configured" });
    }

    if (req.method === "GET" && path === "movies") {
      if (!process.env.TMDB_API_KEY) return reply(res, 503, {error:"Set TMDB_API_KEY in server environment variables to enable real movie search."});
      const url = new URL(req.url, "http://localhost");
      const query = (url.searchParams.get("query") || "").trim();
      const page = Math.max(1, Math.min(500, Number(url.searchParams.get("page") || 1)));
      const language = url.searchParams.get("language") || "en-US";
      const kind = url.searchParams.get("kind") === "tv" ? "tv" : "movie";
      const endpoint = query ? `search/${kind}` : `trending/${kind}/week`;
      const upstream = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${encodeURIComponent(process.env.TMDB_API_KEY)}&language=${encodeURIComponent(language)}&page=${page}${query ? `&query=${encodeURIComponent(query)}` : ""}`);
      const data = await upstream.json().catch(()=>({}));
      if (!upstream.ok) return reply(res, upstream.status, {error:data.status_message || "TMDB request failed."});
      return reply(res, 200, {results:(data.results||[]).map(x=>({id:x.id,title:x.title||x.name||"Untitled",overview:x.overview||"",release_date:x.release_date||x.first_air_date||"",poster_path:x.poster_path?`https://image.tmdb.org/t/p/w500${x.poster_path}`:null,media_type:x.media_type||kind})),page:data.page,total_pages:data.total_pages,total_results:data.total_results,attribution:"This product uses the TMDB API but is not endorsed or certified by TMDB."});
    }

    if (req.method === "GET" && path === "tv") {
      const playlist = process.env.IPTV_M3U_URL || "https://iptv-org.github.io/iptv/index.m3u";
      const upstream = await fetch(playlist, {headers:{"User-Agent":"ITFM-AI-TV/1.0"}});
      if (!upstream.ok) return reply(res, 502, {error:`IPTV playlist returned HTTP ${upstream.status}.`});
      const text = await upstream.text();
      if (text.length > 15_000_000) return reply(res, 502, {error:"Playlist too large."});
      const channels = []; let current = null;
      for (const line of text.split(/\r?\n/)) {
        if (line.startsWith("#EXTINF:")) {
          const name = line.split(",").slice(1).join(",").trim();
          const group = (line.match(/group-title="([^"]*)"/)||[])[1] || "Other";
          const logo = (line.match(/tvg-logo="([^"]*)"/)||[])[1] || "";
          current = {name:name || "Channel", group, logo};
        } else if (line.trim() && !line.startsWith("#") && current) {
          try { const u = new URL(line.trim()); if (["http:","https:"].includes(u.protocol)) channels.push({...current,url:u.href}); } catch {}
          current = null;
        }
      }
      return reply(res, 200, {channels:channels.slice(0,5000),count:channels.length,source:"iptv-org",notice:"Only publicly listed streams are shown. Availability and rights vary by channel and region."});
    }

    if (req.method === "POST" && path === "generate") {
      const body = await readBody(req);
      const tool = String(body.tool || "");
      const allowed = ["image","video","audio","music","cover","stem","genjutsu"];
      if (!allowed.includes(tool)) return reply(res, 400, {error:"Unsupported generation tool."});
      if (!process.env.ITFM_AI_API_KEY || !process.env.ITFM_AI_BASE_URL) return reply(res, 503, {error:"Generation provider is not configured. Add a compatible provider URL and API key in server environment variables. Different tools may require different providers/endpoints."});
      return reply(res, 501, {error:`The configured generic chat endpoint cannot safely assume support for ${tool} generation. Configure the provider-specific endpoint and request format for this tool; no fake output was created.`});
    }
    return reply(res, 404, {error:"ITFM AI API route not found."});
  } catch (e) {
    return reply(res, e.message?.includes("Request too large") ? 413 : 500, {error:e.message || "Unexpected server error."});
  }
};

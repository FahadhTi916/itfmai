export function json(res, status, body) { return res.status(status).json(body); }
export function method(req, res, allowed = ["POST"]) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "OPTIONS") { res.setHeader("Allow", [...allowed, "OPTIONS"].join(", ")); return res.status(204).end(); }
  if (!allowed.includes(req.method)) { res.setHeader("Allow", allowed.join(", ")); res.status(405).json({ error: "Method not allowed" }); return false; }
  return true;
}
export async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 1000) }; }
    if (!response.ok) {
      const message = data?.error?.message || data?.error || data?.message || `Provider returned HTTP ${response.status}`;
      const error = new Error(String(message)); error.status = response.status; throw error;
    }
    return data;
  } finally { clearTimeout(timeout); }
}
export function safeError(res, error) {
  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 600 ? error.status : 502;
  return res.status(status).json({ error: error?.name === "AbortError" ? "Provider timed out. Try again." : (error?.message || "Provider request failed.") });
}
export const PROVIDERS = {
  gemini_chat: { env: "GEMINI_API_KEY", label: "Gemini AI Chat" },
  tmdb_movies: { env: "TMDB_API_KEY", label: "TMDB Movies" },
  whoisjson: { env: "WHOISJSON_API_KEY", label: "WhoisJSON Free Domain" },
  getimg_image: { env: "GETIMG_API_KEY", label: "AI Image" },
  getimg_video: { env: "GETIMG_VIDEO_API_KEY", label: "AI Video" },
  eleven_audio: { env: "ELEVENLABS_API_KEY", label: "Audio & Voice" },
  eleven_music: { env: "MUSIC_API_KEY", label: "AI Music" },
  acemusic_cover: { env: "ACEMUSIC_API_KEY", label: "AI Cover / Karaoke" },
  higgsfield_genjutsu: { env: "HIGGSFIELD_API_KEY", label: "Genjutsu AI / Higgsfield" },
  saverapi: { env: "SAVERAPI_API_KEY", label: "SaverAPI Downloader" },
  dlgram: { env: "DLGRAM_API_KEY", label: "DLGram Downloader" },
  socialkit: { env: "SOCIALKIT_API_KEY", label: "SocialKit Downloader" },
  revid: { env: "REVID_API_KEY", label: "Revid Downloader" },
  playterabox: { env: "PLAYTERABOX_API_KEY", label: "PlayTeraBox Downloader" }
};
export function keyFor(id) { const item = PROVIDERS[id]; return item ? process.env[item.env] : undefined; }
export function genericProxy(req, res, { keyEnv, urlEnv, label, method: allowedMethod = "POST" }) {
  if (!method(req, res, [allowedMethod])) return;
  const key = process.env[keyEnv], url = process.env[urlEnv];
  if (!key) return json(res, 503, { error: `${label} is not configured. Add ${keyEnv} in Vercel Environment Variables.` });
  if (!url) return json(res, 503, { error: `${label} API endpoint is not configured. Add ${urlEnv} using the provider's documented endpoint.` });
  if (!/^https:\/\//i.test(url)) return json(res, 500, { error: `${urlEnv} must be an HTTPS URL.` });
  return (async () => {
    try {
      const headers = { Authorization: `Bearer ${key}`, "Content-Type": req.headers["content-type"] || "application/json", Accept: "application/json" };
      if (req.headers["content-type"]?.includes("multipart/form-data")) delete headers["Content-Type"];
      const response = await fetch(url, { method: allowedMethod, headers, body: allowedMethod === "GET" ? undefined : (typeof req.body === "string" ? req.body : JSON.stringify(req.body || {})) });
      const text = await response.text(); let body; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 1000) }; }
      if (!response.ok) return json(res, response.status, { error: body?.error?.message || body?.error || body?.message || `${label} returned HTTP ${response.status}` });
      return json(res, 200, body);
    } catch (e) { return safeError(res, e); }
  })();
}

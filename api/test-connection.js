import { method, json, requestJson, safeError, PROVIDERS, keyFor } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const id = String(req.body?.id || ""); const item = PROVIDERS[id];
  if (!item) return json(res, 400, { error: "Unknown provider ID." });
  const key = keyFor(id); if (!key) return json(res, 503, { error: `${item.label}: missing ${item.env} in Vercel Environment Variables.` });
  try {
    if (id === "gemini_chat") { await requestJson(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`); }
    else if (id === "tmdb_movies") { await requestJson(`https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(key)}`); }
    else if (id === "whoisjson") { const base = process.env.WHOISJSON_API_URL || "https://api.whoisjson.com/v1/whois"; const url = new URL(base); url.searchParams.set("domain", "example.com"); await requestJson(url.toString(), { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } }); }
    else { const endpointEnv = { getimg_image: "GETIMG_IMAGE_API_URL", getimg_video: "GETIMG_VIDEO_API_URL", eleven_audio: "ELEVENLABS_TTS_API_URL", eleven_music: "MUSIC_API_URL", acemusic_cover: "ACEMUSIC_API_URL", higgsfield_genjutsu: "HIGGSFIELD_API_URL", saverapi: "SAVERAPI_API_URL", dlgram: "DLGRAM_API_URL", socialkit: "SOCIALKIT_API_URL", revid: "REVID_API_URL", playterabox: "PLAYTERABOX_API_URL" }[id];
      if (!endpointEnv || !process.env[endpointEnv]) return json(res, 503, { error: `${item.label}: key exists, but the provider API endpoint (${endpointEnv || "not mapped"}) is not configured.` });
      // A provider's endpoint contract varies; a key-only check is not claimed as a successful API test.
      return json(res, 200, { connected: true, message: `${item.label}: key and endpoint are configured. Full API operation still needs provider-specific request validation.` });
    }
    return json(res, 200, { connected: true, message: `${item.label}: API authentication succeeded.` });
  } catch (error) { return safeError(res, error); }
}

import { method, json, safeError } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return json(res, 503, { error: "Speech-to-text is not configured. Add ELEVENLABS_API_KEY to Vercel." });
  try {
    const endpoint = process.env.ELEVENLABS_STT_API_URL || "https://api.elevenlabs.io/v1/speech-to-text";
    const r = await fetch(endpoint, { method: "POST", headers: { "xi-api-key": key, Accept: "application/json", "Content-Type": req.headers["content-type"] || "application/json" }, body: typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}) });
    const text = await r.text(); let data; try { data = JSON.parse(text); } catch { data = { error: text.slice(0, 500) }; }
    if (!r.ok) return json(res, r.status, { error: data.error || `ElevenLabs returned HTTP ${r.status}` });
    return json(res, 200, { ...data, text: data.text || data.transcription, provider: "ElevenLabs" });
  } catch (e) { return safeError(res, e); }
}

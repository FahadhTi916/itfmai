import { method, json, safeError } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return json(res, 503, { error: "Audio & Voice is not configured. Add ELEVENLABS_API_KEY to Vercel." });
  const { text, voiceId = "21m00Tcm4TlvDq8ikWAM", modelId = "eleven_multilingual_v2" } = req.body || {};
  if (!text || typeof text !== "string") return json(res, 400, { error: "Text is required for text-to-speech." });
  try {
    const endpoint = process.env.ELEVENLABS_TTS_API_URL || "https://api.elevenlabs.io/v1/text-to-speech";
    const url = `${endpoint.replace(/\/$/, "")}/${encodeURIComponent(voiceId)}`;
    const r = await fetch(url, { method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify({ text: text.slice(0, 5000), model_id: modelId }) });
    if (!r.ok) { const t = await r.text(); return json(res, r.status, { error: t.slice(0, 500) || `ElevenLabs returned HTTP ${r.status}` }); }
    const bytes = Buffer.from(await r.arrayBuffer());
    return json(res, 200, { kind: "audio", mimeType: "audio/mpeg", url: `data:audio/mpeg;base64,${bytes.toString("base64")}`, provider: "ElevenLabs" });
  } catch (e) { return safeError(res, e); }
}

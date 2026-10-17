import { method, json, requestJson, safeError } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(res, 503, { error: "Gemini is not configured. Add GEMINI_API_KEY in Vercel Environment Variables, then redeploy." });
  const { message, mimeType, imageData, fileMimeType, fileData, fileName } = req.body || {};
  if (typeof message !== "string" || !message.trim()) return json(res, 400, { error: "A non-empty message is required." });
  const parts = [{ text: message.trim().slice(0, 20000) }];
  if (imageData && mimeType && /^image\/(png|jpeg|webp|gif)$/.test(mimeType)) parts.push({ inlineData: { mimeType, data: String(imageData).replace(/^data:[^,]+,/, "").slice(0, 12 * 1024 * 1024) } });
  else if (fileData && fileMimeType && /^application\/(pdf|text|json|xml)|^text\//.test(fileMimeType)) parts.push({ inlineData: { mimeType: fileMimeType, data: String(fileData).replace(/^data:[^,]+,/, "").slice(0, 12 * 1024 * 1024) } });
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const data = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }) });
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("\n").trim();
    if (!text) return json(res, 502, { error: "Gemini returned no text. Check the model, key permissions, and quota." });
    return json(res, 200, { text, provider: "Gemini", model });
  } catch (error) { return safeError(res, error); }
}

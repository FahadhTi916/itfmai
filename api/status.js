import { method, json, requestJson, safeError } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const provider = String(req.query?.provider || "");
  const urls = { higgsfield: process.env.HIGGSFIELD_STATUS_API_URL, getimg: process.env.GETIMG_STATUS_API_URL, external: process.env.ACEMUSIC_STATUS_API_URL };
  const base = urls[provider];
  const keyNames = { higgsfield: "HIGGSFIELD_API_KEY", getimg: "GETIMG_API_KEY", external: "ACEMUSIC_API_KEY" };
  const key = process.env[keyNames[provider]];
  if (!base || !key) return json(res, 503, { error: `Status polling is not configured for ${provider}. Set the provider status URL and API key.` });
  try { const url = new URL(base); url.searchParams.set("id", String(req.query?.id || "")); const data = await requestJson(url.toString(), { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } }); return json(res, 200, data); }
  catch (error) { return safeError(res, error); }
}

import { genericProxy } from "./_lib.js";
const mapping = { saverapi: ["SAVERAPI_API_KEY", "SAVERAPI_API_URL", "SaverAPI"], dlgram: ["DLGRAM_API_KEY", "DLGRAM_API_URL", "DLGram"], socialkit: ["SOCIALKIT_API_KEY", "SOCIALKIT_API_URL", "SocialKit"], revid: ["REVID_API_KEY", "REVID_API_URL", "Revid"], playterabox: ["PLAYTERABOX_API_KEY", "PLAYTERABOX_API_URL", "PlayTeraBox"] };
export default async function handler(req, res) {
  const provider = String(req.body?.provider || req.query?.provider || ""); const config = mapping[provider];
  if (!config) return res.status(400).json({ error: "Unknown downloader service. Choose a separately configured downloader provider." });
  return genericProxy(req, res, { keyEnv: config[0], urlEnv: config[1], label: config[2], method: req.method === "GET" ? "GET" : "POST" });
}

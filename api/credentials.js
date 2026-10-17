import { method, json } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  return json(res, 410, { error: "API keys are configured in Vercel Project → Settings → Environment Variables. Do not enter or store production keys in the browser. The legacy browser credential vault is disabled." });
}

import { method, json, requestJson, safeError } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const domain = String(req.query?.domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[\/\?#]/)[0];
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return json(res, 400, { error: "Enter a valid domain, such as example.com." });
  const key = process.env.WHOISJSON_API_KEY, base = process.env.WHOISJSON_API_URL || "https://api.whoisjson.com/v1/whois";
  if (!key) return json(res, 503, { error: "WhoisJSON is not configured. Add WHOISJSON_API_KEY in Vercel Environment Variables." });
  if (!/^https:\/\//i.test(base)) return json(res, 500, { error: "WHOISJSON_API_URL must be an HTTPS URL." });
  try {
    const url = new URL(base); url.searchParams.set("domain", domain);
    // API authentication methods differ by plan; default to Bearer, override the URL if your plan specifies another endpoint.
    const data = await requestJson(url.toString(), { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
    return json(res, 200, { domain, provider: "WhoisJSON", lookup: data, availability: "unknown", note: "WHOIS records alone do not guarantee live registration availability. Confirm with a registrar before purchase." });
  } catch (error) { return safeError(res, error); }
}

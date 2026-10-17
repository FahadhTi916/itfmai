import { genericProxy } from "./_lib.js";
export default async function handler(req, res) { return genericProxy(req, res, { keyEnv: "ACEMUSIC_API_KEY", urlEnv: "ACEMUSIC_API_URL", label: "AI Cover / Karaoke" }); }

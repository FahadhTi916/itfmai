import { genericProxy } from "./_lib.js";
export default async function handler(req, res) { return genericProxy(req, res, { keyEnv: "MUSIC_API_KEY", urlEnv: "MUSIC_API_URL", label: "AI Music" }); }

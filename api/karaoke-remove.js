import { genericProxy } from "./_lib.js";
export default async function handler(req, res) { return genericProxy(req, res, { keyEnv: "KARAOKE_REMOVE_API_KEY", urlEnv: "KARAOKE_REMOVE_API_URL", label: "Karaoke removal" }); }

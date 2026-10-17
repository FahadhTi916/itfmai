import { genericProxy } from "./_lib.js";
export default async function handler(req, res) { return genericProxy(req, res, { keyEnv: "BACKGROUND_REMOVE_API_KEY", urlEnv: "BACKGROUND_REMOVE_API_URL", label: "Background removal" }); }

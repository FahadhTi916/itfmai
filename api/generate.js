import { genericProxy } from "./_lib.js";
export default async function handler(req, res) {
  const provider = String(req.body?.provider || req.headers["x-itfmai-provider"] || "");
  if (provider === "higgsfield" || provider === "higgsfield_genjutsu") return genericProxy(req, res, { keyEnv: "HIGGSFIELD_API_KEY", urlEnv: "HIGGSFIELD_API_URL", label: "Higgsfield / Genjutsu AI" });
  if (provider === "getimg" || provider === "getimg_image") return genericProxy(req, res, { keyEnv: "GETIMG_API_KEY", urlEnv: "GETIMG_IMAGE_API_URL", label: "AI Image" });
  if (provider === "getimg_video") return genericProxy(req, res, { keyEnv: "GETIMG_VIDEO_API_KEY", urlEnv: "GETIMG_VIDEO_API_URL", label: "AI Video" });
  return res.status(400).json({ error: "Unknown generation provider. Configure a supported provider and endpoint." });
}

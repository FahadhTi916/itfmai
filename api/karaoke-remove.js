// ITFM AI API route: /api/karaoke-remove
// Server-side provider integration must be implemented here.
// Keep provider secrets in Vercel Environment Variables; never expose them to the browser.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(204).end();
  }
  return res.status(501).json({
    error: "This API integration is not configured yet.",
    route: "/api/karaoke-remove",
    message: "Add and test the provider-specific server-side implementation before production use."
  });
}

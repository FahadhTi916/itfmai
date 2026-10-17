import { method, json, requestJson, safeError } from "./_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const key = process.env.TMDB_API_KEY;
  if (!key) return json(res, 503, { error: "TMDB is not configured. Add TMDB_API_KEY in Vercel Environment Variables." });
  const query = String(req.query?.query || "").trim().slice(0, 120);
  const page = Math.max(1, Math.min(500, Number(req.query?.page || 1)));
  const category = String(req.query?.category || "trending");
  let path = category === "search" ? "/search/movie" : category === "popular" ? "/movie/popular" : "/trending/movie/week";
  if (category === "search" && !query) return json(res, 400, { error: "Provide a query to search movies." });
  const params = new URLSearchParams({ api_key: key, language: "en-US", page: String(page) }); if (query) params.set("query", query);
  try { const data = await requestJson(`https://api.themoviedb.org/3${path}?${params}`, { headers: { Accept: "application/json" } }); return json(res, 200, { ...data, imageBaseUrl: "https://image.tmdb.org/t/p/w500" }); }
  catch (error) { return safeError(res, error); }
}

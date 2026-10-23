# ITFM AI — API-integrated project

This project remains a static HTML dashboard plus Vercel serverless endpoints. The existing visual layout and navigation are retained.

## Included integrations
- **TMDB**: server-side API-key proxy at `/api/tmdb`; trending, popular, top-rated, upcoming, TV popular and multi-search controls. Poster images use TMDB image CDN. Details requests can be fetched through the same endpoint. TMDB key required.
- **AI Chat**: `/api/chat` uses OpenRouter. Configure a key and select a currently available free model. “Free” model availability, quotas, and limits can change; the app does not promise unlimited free use.
- **AI Image**: uses the public Pollinations image URL endpoint from the browser. This is a best-effort public endpoint, not a guaranteed SLA or quota-free service. If unavailable, the UI reports failure.
- **IPTV-org**: loads the public channel directory and offers public M3U and EPG resource links. Directory entries do not guarantee playback, availability, legality in every region, or streaming rights. The app intentionally does not fabricate stream URLs or auto-play unverified streams.
- **Genjutsu AI**: no verified official public API schema is embedded. The backend reports this honestly unless endpoint and key are configured; even then integration is intentionally blocked until the provider request/response contract is supplied.
- **Video, voice/audio, music, cover/karaoke, STEM separation**: not falsely represented as implemented. They show explicit configuration/availability messages. There is no single verified, unrestricted, 100%-free hosted API for all of these. A self-hosted open-source model/service can be added, but requires infrastructure and may require GPU/CPU resources.

## Environment variables
Copy `.env.example` to `.env` for local development or add the values in Vercel Project → Settings → Environment Variables.

- `TMDB_API_KEY` — TMDB v3 API key. Required for TMDB endpoints.
- `OPENROUTER_API_KEY` — OpenRouter key for AI chat.
- `OPENROUTER_MODEL` — optional model ID; default is `meta-llama/llama-3.3-70b-instruct:free`. Free models may change or be rate-limited.
- `APP_URL` — optional public app URL for provider metadata.
- `GENJUTSU_API_URL`, `GENJUTSU_API_KEY` — reserved for a documented official Genjutsu API; not enabled without a known API contract.

Never put secret keys into `index.html` or any browser-side JavaScript.

## Run / deploy
1. Use Node.js 20 or later.
2. Install dependencies (none required by the current implementation): `npm install`.
3. Set environment variables.
4. Deploy the project to Vercel using the project root and the Other framework preset. The `/api/[...route].js` function handles the API routes.
5. Test `/api/health`, `/api/tmdb?route=trending/movie/week`, and AI chat in the deployed app.

For local serverless testing, install Vercel CLI separately and run `vercel dev`; a plain static file server will not execute `/api` routes.

## Limitations and honest status
- This environment has no provider credentials, so live API calls were not authenticated or end-to-end tested here.
- TMDB requires a valid key and use must follow TMDB terms/attribution requirements.
- OpenRouter free model availability is provider-controlled and can change.
- Public image endpoints can be rate-limited or changed.
- IPTV-org publishes channel listings/playlists/EPG, but not every listed channel is necessarily reachable or authorized in every location.
- STEM separation is not implemented as a hosted backend. For a fully free self-hosted route, run Demucs (open source) on your own machine/server and connect it through a secured endpoint.
- AI video/music/voice/cover generation are not activated by placeholder responses; connect a provider or self-hosted model before claiming those functions work.

## Files
- `index.html` — existing UI with live TMDB/IPTV integrations and best-effort image/chat calls.
- `api/[...route].js` — secure server-side API routes.
- `.env.example` — documented configuration template.
- `package.json` — ESM runtime metadata.
- `vercel.json` — existing Vercel configuration.
- `check.js` — original standalone/legacy script kept for reference; the production page uses its embedded script.

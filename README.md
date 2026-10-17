# ITFM AI — GitHub + Vercel deployment

This repository contains the ITFM AI frontend, Vercel serverless API routes, and a Vercel Environment Variable checklist. It is designed to be pushed to GitHub and imported into Vercel.

## Deploy

1. Extract this ZIP. Keep `index.html`, `styles.css`, `api/`, `package.json`, `vercel.json`, and `.env.example` in the repository root.
2. Create a GitHub repository and upload/commit the project files. `.gitignore` excludes `.env` files and deployment artifacts.
3. In Vercel, choose **Add New → Project**, import the GitHub repository, and deploy. No frontend build command is required.
4. In Vercel → Project → Settings → Environment Variables, add the variables from `.env.example` with your own API keys. Do not commit real keys to GitHub.
5. Redeploy after changing environment variables.
6. Open **API Settings** in ITFM AI to see whether the server can detect each key.

## Implemented server routes

- `POST /api/chat` — real Gemini `generateContent` integration (`GEMINI_API_KEY`, optional `GEMINI_MODEL`).
- `GET /api/movies?category=trending|popular` or `GET /api/movies?category=search&query=...` — TMDB API (`TMDB_API_KEY`).
- `GET /api/domain-search?domain=example.com` — WhoisJSON lookup (`WHOISJSON_API_KEY`, optional `WHOISJSON_API_URL`). WHOIS lookup data is not a guarantee of live registration availability.
- `GET /api/config-status` — returns configured/missing flags only, never secrets.
- `POST /api/test-connection` — real auth tests for Gemini and TMDB; for some providers, verifies key/endpoint configuration but not a complete provider job.
- `POST /api/tts` — ElevenLabs text-to-speech (`ELEVENLABS_API_KEY`).
- Other generation/removal/download routes are secure server-side proxy scaffolds using distinct environment keys and endpoint variables. Their request/response adapters must match each provider's official API contract.

## Provider endpoint requirements

An API key is not sufficient for every integration. Get the correct API endpoint, authentication scheme, request format, job-status URL and response format from each provider's official dashboard/docs. Configure the corresponding `*_API_URL` variables. The generic proxy currently assumes Bearer auth and JSON payloads; providers that use custom headers, multipart uploads, async jobs, or a different schema need a provider-specific adapter before production use.

- AI Image: `GETIMG_API_KEY`, `GETIMG_IMAGE_API_URL`
- AI Video: `GETIMG_VIDEO_API_KEY`, `GETIMG_VIDEO_API_URL`
- Audio & Voice: `ELEVENLABS_API_KEY`
- AI Music: `MUSIC_API_KEY`, `MUSIC_API_URL`
- AI Cover / Karaoke: `ACEMUSIC_API_KEY`, `ACEMUSIC_API_URL`
- Genjutsu AI: `HIGGSFIELD_API_KEY`, `HIGGSFIELD_API_URL`, optional `HIGGSFIELD_STATUS_API_URL`
- Movies: `TMDB_API_KEY`
- Free Domain: `WHOISJSON_API_KEY`, optional `WHOISJSON_API_URL`
- Downloader: each service has its own `*_API_KEY` and `*_API_URL` pair.

## Security

- Never paste API keys into `index.html`, `styles.css`, client-side JavaScript, GitHub, or chat messages.
- Use Vercel Environment Variables for secrets. Frontend code only calls same-origin `/api/...` endpoints.
- Add rate limiting, abuse controls, provider-specific request validation and quotas before making generation endpoints public.
- The old browser credential-vault UI is disabled; configure secrets in Vercel instead.

## Local development

```bash
npm install
npx vercel dev
```

Create a local `.env` file from `.env.example` for local testing only. `.env` is ignored by Git.


## Movies update
- Added Jailer 2 (2026) to the Movies catalogue with the requested 7.9 rating, Malayalam display language, Mystery/Thriller genres, official-trailer search, legal-streaming search, and My List support.
- The Jailer 2 poster rotates daily between a small set of public image sources. Cast portraits are loaded from Wikipedia page summaries when the detail panel opens; internet access is required.


## Movie gallery improvements
- All movie cards now show a daily-changing image selection using available poster/backdrop artwork.
- Every movie detail view displays cast portrait cards and attempts to load actor photos from Wikipedia page summaries; fallback avatars remain if a photo is unavailable.
- Changes are applied to the embedded Movies page, so no separate page file is needed.


## Real cast portraits on every movie
- Movie details now request TMDB cast credits by movie title and render real actor profile photos and character names for every movie, including live search results.
- If TMDB has no portrait for an actor, the UI uses a fallback avatar; if the TMDB key or network is unavailable, it falls back to Wikipedia thumbnails for the catalogue cast.
- Configure `TMDB_API_KEY` in Vercel Environment Variables and redeploy for TMDB cast portraits.


## Live daily movie updates
- The Movies page now requests live latest/now-playing, daily trending, and upcoming titles from TMDB whenever it opens, and refreshes when the local day changes.
- Daily poster selection uses poster/backdrop artwork when both are available.
- Add `TMDB_API_KEY` in Vercel Environment Variables and redeploy. If the key is missing or TMDB is unreachable, the built-in catalogue remains as a fallback.
- Trailer buttons open YouTube official-trailer search; full-length films are not hosted by this project and must be watched through licensed providers.


## UI redesign update
The UI stylesheet has been refreshed with a responsive, colorful design system for dark/light themes, dashboard tool cards, forms, previews, chat, media cards, and mobile layouts. Existing API routes and provider configuration are preserved. Provider-backed tools still require their documented environment variables and provider-specific adapters; see the API and Provider endpoint requirements above.

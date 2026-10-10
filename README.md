# ITFM AI — seven-room workspace

This project contains the seven requested rooms: AI Image Studio, AI Video Studio, Audio & Voice, AI Music, AI Cover / Karaoke, AI Chat, and Genjutsu AI. It includes a consistent single-color theme and a fix that prevents `/v1/v1/...` URLs when the configured gateway base already ends in `/v1`.

## Deploy to Vercel
1. Import/push this project to the connected GitHub repository.
2. In Vercel → Project → Settings → Environment Variables, add `GEMINI_API_KEY` for AI Chat.
3. For other provider-backed generation routes, set `ITFMAI_API_KEY` and `ITFMAI_API_URL` only if you have a compatible gateway that implements the endpoints listed below.
4. Redeploy after saving variables. Never put secret keys in browser code or share them in screenshots.

## Important capability notes
- `GEMINI_API_KEY` enables the server-side Gemini Chat route. It does not automatically enable every other room.
- The remaining server API routes are limited to the seven studios: generation (`/api/generate`), generation status (`/api/status`), media delivery (`/api/media`), chat (`/api/chat`), cover (`/api/cover`), speech-to-text (`/api/transcribe`), text-to-speech (`/api/tts`), and provider status (`/api/providers`). A compatible provider must implement the generation endpoints the selected studio needs.
- A Vercel AI Gateway/OpenAI-compatible base URL does not, by itself, provide arbitrary `/v1/image`, `/v1/video`, `/v1/music`, or karaoke endpoints.
- No single API key can guarantee all seven features are free. Free tiers have limits, and video/music/cover services may require separate providers or paid credits.
- The UI reports provider errors rather than inventing generated outputs. Test each room after deployment.

## Environment variables
See `.env.example`. Keep all keys server-side.

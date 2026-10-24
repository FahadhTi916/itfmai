# ITFM AI API — single-key provider configuration

`ITFM_AI_API_KEY` is the only AI-provider secret. The chat and generation functions read it server-side from Supabase Function Secrets. Provider base URLs, endpoint paths and default model IDs are code constants in `supabase/functions/ai-chat/index.ts` and `supabase/functions/ai-generate/index.ts`, not extra environment variables.

## Important compatibility note

A single API key can authenticate multiple AI features only when the same provider account grants access to those modalities. The current defaults point to Venice AI. Chat and image use the documented OpenAI-compatible shapes. Video, audio, music and Genjutsu use default endpoint paths/request shapes that must be verified against the provider's current API documentation and account access; if an endpoint is unsupported, the provider will return an error and that adapter must be updated in code. Removing environment variables does not create provider capabilities or free quota.

## STEM GRAB / Karaoke / AI Cover

These use the separate Python media worker, not the AI provider API key: `stem` and `karaoke` use Demucs; `cover` also requires a configured RVC inference service and an authorized voice model. `ITFM_MEDIA_WORKER_URL` and `ITFM_MEDIA_WORKER_SECRET` are operational connection/auth settings, not additional AI provider API keys, and are needed to call the separately hosted worker.

## Other required settings

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: public frontend connection settings for Supabase.
- `TMDB_API_KEY`: separate key because TMDB is a different, non-AI service.
- `ITFM_MEDIA_WORKER_URL` and `ITFM_MEDIA_WORKER_SECRET`: required only for the separate audio worker.
- `SUPABASE_SERVICE_ROLE_KEY`, RVC settings: worker-host settings only, never expose to the frontend or commit to GitHub.

Never place `ITFM_AI_API_KEY`, service-role keys, or worker secrets in `config.js`, HTML, Vercel public variables, or GitHub.

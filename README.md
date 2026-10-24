# ITFM AI API

> **Local no-key mode:** See [`LOCAL_MODE.md`](LOCAL_MODE.md) and run `start-local.bat` (Windows) or `python3 local_server.py` (macOS/Linux). This adds a local Ollama chat backend; it does not make every image/video/music feature work automatically without its own local runtime.

Responsive ITFM AI dashboard for GitHub + Vercel, with Supabase Authentication, Edge Functions, private Storage, TMDB proxy, IPTV-org channel catalog, and an audio worker scaffold.

## What is connected

- Supabase email/password sign-up and sign-in UI.
- AI Chat through a server-side OpenAI-compatible Chat Completions endpoint.
- AI Image, Video, Audio, Music, and Genjutsu use the single ITFM_AI_API_KEY credential. Provider endpoint paths and default model IDs are code constants, not separate AI secrets; unsupported provider modalities require updating the adapter code.
- TMDB movie search/trending through a Supabase Edge Function; TV search is supported by the function (`path=search/tv`).
- IPTV-org public India channel/stream catalogue loaded at runtime.
- STEM GRAB worker using Demucs, with private Supabase Storage result upload.
- Karaoke can use the STEM GRAB separation flow once worker is deployed.
- AI Cover pipeline separates vocals with Demucs, calls a configured RVC inference adapter, then mixes the converted vocal with the instrumental. It requires the separately deployed adapter and an authorized voice model.

## Security model

- `ITFM_AI_API_KEY` is a server-side Supabase secret; never put it in `config.js`, `index.html`, GitHub, or client-side environment variables.
- `config.js` contains only the Supabase project URL and anon/publishable key. The anon key is intended for the browser and must be protected by RLS.
- The Supabase service-role key and `ITFM_MEDIA_WORKER_SECRET` belong only in the Python worker's server environment.
- Do not commit `.env` files or real credentials.
- `ITFM_AI_API_KEY` is the only AI-provider API key. The default adapter points to Venice AI; endpoint paths and model IDs are constants in the Edge Function code. The provider must support each modality for it to work. Supabase connection settings, the TMDB key, and media-worker connection settings are infrastructure/non-AI settings, not additional AI provider keys.

## 1. Configure Supabase

1. Create your own project at https://supabase.com.
2. In `config.js`, replace `YOUR_PROJECT` and `YOUR_SUPABASE_ANON_KEY` with your project URL and anon/publishable key.
3. Apply `supabase/migrations/202610240001_itfm_initial.sql` in the Supabase SQL Editor or via Supabase CLI.
4. Set Edge Function secrets in your own project:
   ```sh
   supabase secrets set ITFM_AI_API_KEY='your-own-provider-key'
   supabase secrets set TMDB_API_KEY='your-own-tmdb-key'
   supabase secrets set ITFM_MEDIA_WORKER_URL='https://your-worker.example'
   supabase secrets set ITFM_MEDIA_WORKER_SECRET='a-long-random-secret'
   ```
   Only set endpoints for features supported by your provider. These endpoint names are configuration examples, not public service URLs.
5. Deploy functions:
   ```sh
   supabase functions deploy ai-chat
   supabase functions deploy ai-generate
   supabase functions deploy tmdb
   supabase functions deploy media-proxy
   ```
6. Enable email/password Authentication in Supabase. For production, configure email confirmation and allowed redirect URLs.

## 2. Deploy the frontend

1. Upload this folder to your own GitHub repository.
2. Import the repository in Vercel. Use the **Other** preset; no build command is required for the static HTML app.
3. Deploy and open the Vercel URL.
4. Sign up or sign in using the dashboard auth panel.

## 3. Deploy the Demucs worker

The worker is a separate Python service. It is not hosted by Vercel or Supabase Edge Functions. It needs enough RAM/disk and may benefit from a GPU. Model weights download on first use.

Required worker environment variables:
- `ITFM_MEDIA_WORKER_SECRET` — same value as the Supabase Edge Function secret.
- `SUPABASE_URL` — your project URL.
- `SUPABASE_ANON_KEY` — your project's anon/publishable key (worker uses it to validate the signed-in user JWT).
- `SUPABASE_SERVICE_ROLE_KEY` — secret, worker-only; grants storage upload rights.
- Optional `ITFM_MEDIA_BUCKET=media-results`.
- For AI Cover, `RVC_INFERENCE_URL` must point to your authenticated RVC-compatible inference service; optional `RVC_INFERENCE_TOKEN` and `RVC_DEFAULT_VOICE_MODEL` are configured on the worker host.

Build and run:
```sh
cd worker
docker build -t itfm-media-worker .
docker run --rm -p 8080:8080 \
  -e ITFM_MEDIA_WORKER_SECRET='same-long-random-secret' \
  -e SUPABASE_URL='https://YOUR_PROJECT.supabase.co' \
  -e SUPABASE_ANON_KEY='your-anon-key' \
  -e SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' \
  itfm-media-worker
```
Set `ITFM_MEDIA_WORKER_URL` in Supabase to the publicly reachable HTTPS URL of this worker. Do not expose the worker secret to the browser.

The worker accepts an authenticated job with a short-lived private Supabase Storage signed URL. STEM processing is limited to 100 MB and can take several minutes. Resource limits depend on the host. `/health` checks worker availability.

## 4. AI Cover / Karaoke status

- Karaoke/stem separation: uses Demucs via the worker and returns a ZIP of separated tracks.
- AI Cover: this project intentionally does not invent a fake result. To enable it, deploy/configure an RVC inference service with the request/response contract in `worker/RVC_ADAPTER.md`; set `RVC_INFERENCE_URL` and, if needed, `RVC_INFERENCE_TOKEN` on the worker host. Use only voice models and source audio you have permission to process. Do not use a real person's voice without authorization.

## 5. Provider compatibility

The `ai-chat` and `ai-generate` functions use only `ITFM_AI_API_KEY` for AI-provider authentication. Their default provider URLs and models are code constants. Check `PROVIDER_ADAPTERS.md`: a single key does not guarantee that the provider supports image, video, audio, music, and chat on one account. Update the code adapter if the provider uses different endpoints or schemas.

## 6. Free-tier expectations

- Supabase and Vercel have free plans with quotas and restrictions that may change.
- TMDB requires your own API key and is subject to TMDB terms and attribution requirements.
- IPTV-org provides a public catalogue, but streams can be unavailable, geo-restricted, removed, or subject to third-party rights.
- Demucs and RVC code may be open source, but compute, bandwidth, storage, and model licences still matter.
- No claim is made that all AI generation is unlimited or 100% free.

## 7. Smoke-test checklist

- [ ] Frontend Supabase URL/anon key configured.
- [ ] Sign up, confirm email if enabled, and sign in.
- [ ] `ai-chat` returns a real provider response.
- [ ] Each configured generation endpoint returns the expected output schema.
- [ ] TMDB trending and search return results.
- [ ] IPTV-org catalogue loads and selected stream plays where available.
- [ ] Worker `/health` responds.
- [ ] STEM GRAB uploads an audio file, produces a ZIP, and a signed download URL works.
- [ ] AI Cover remains disabled until the RVC adapter and authorized model are installed.

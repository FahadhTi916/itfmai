# ITFM AI Studio — Vercel starter

This project packages the uploaded `index.html` as the **ITFM AI** site and keeps its embedded pages and frontend code. The linked stylesheet has been extracted to `styles.css`.

## Important status

- The frontend is included from the uploaded file.
- The API endpoints in `api/` are **safe placeholders returning HTTP 501**. They are not live AI integrations yet.
- Adding an API key to Vercel does not automatically connect a provider. Each endpoint must be implemented for that provider's API, request format, authentication, and response format.
- The original frontend calls endpoints such as `/api/generate`, `/api/chat`, `/api/music`, `/api/cover`, `/api/tts`, `/api/transcribe`, `/api/background-remove`, `/api/karaoke-remove`, `/api/social-download`, `/api/media`, `/api/status`, `/api/test-connection`, `/api/credentials`, and `/api/vault-auth`.

## Deploy to GitHub and Vercel

1. Extract this ZIP.
2. Create a new repository on GitHub, for example `itfm-ai`.
3. Upload/commit the files in this folder to the repository root (including `api/`, `index.html`, `styles.css`, `vercel.json`, and `package.json`).
4. In Vercel, choose **Add New → Project**, import the GitHub repository, and deploy. This is a static frontend plus Vercel serverless-function scaffold; no build command is required.
5. In Vercel → Project → Settings → Environment Variables, add the real provider keys. Redeploy after changing environment variables.

## Environment variable names

Use `.env.example` as a checklist. Suggested names:
- `GETIMG_API_KEY` — image/video provider (confirm your provider plan/API access)
- `ELEVENLABS_API_KEY` — audio/voice (music support depends on the provider's current API/product access)
- `ACEMUSIC_API_KEY` — cover/karaoke provider
- `GEMINI_API_KEY` — Gemini chat
- `HIGGSFIELD_API_KEY` — Higgsfield/Genjutsu
- `TMDB_API_KEY` — movie metadata
- `SAVERAPI_API_KEY`, `DLGRAM_API_KEY`, `SOCIALKIT_API_KEY`, `REVID_API_KEY`, `PLAYTERABOX_API_KEY` — only for downloader services you are authorized to use
- `WHOISJSON_API_KEY` — only if using an authenticated WhoisJSON plan; check its current API requirements
- `ITFMAI_ADMIN_PASSWORD` and `ITFMAI_ENCRYPTION_KEY` — only after the credential-vault backend is implemented

## Security checklist

- **Never** paste real keys into `index.html`, `styles.css`, GitHub, or a public chat.
- Keep keys as Vercel Environment Variables and read them only in server-side `/api` functions.
- Use provider official documentation to implement each API route and validate inputs, handle rate limits, and avoid logging secrets.
- Do not assume downloader integrations work without provider-specific authorization and compliant use.
- Before production, replace all placeholder handlers and test every feature in the deployed site.

## Local development

Install Node.js, then run:

```bash
npm install
npx vercel dev
```

The placeholder API routes intentionally return 501 until implemented.

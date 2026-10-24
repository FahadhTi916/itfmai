# ITFM AI — Free-tier API platform starter

This ZIP updates the supplied ITFM AI front-end and adds a server-side API router. It keeps secrets on the server and does not invent API keys or fake generation results.

## Included
- Existing responsive ITFM AI interface (`index.html`)
- Vercel serverless API router (`api/index.js`)
- `GET /api/health` — reports which environment settings exist
- `POST /api/chat` — OpenAI Chat Completions-compatible provider proxy
- `GET /api/movies?query=...` — real TMDB search/trending results
- `GET /api/tv` — reads a public IPTV-org M3U playlist and parses channel URLs
- `POST /api/generate` — clearly reports that feature-specific generation endpoints still need provider-specific integration
- `.env.example` — environment variable template

## Important: what is and isn't ready
The project cannot create ITFM AI API keys by itself. ITFM AI is your brand; keys must be issued by each upstream provider or your own hosted backend. No provider documentation or credentials were supplied for an “ITFM AI API”, so image/video/audio/music/cover/stem/Genjutsu generation is not falsely represented as live. Each of those services can have a different API URL, authentication scheme, request format, limits and licensing. Add provider-specific adapters after choosing a provider.

“100% free” cannot be guaranteed for every feature. Free tiers may have quotas, require billing verification, change terms, or exclude commercial use. Open-source models may need a computer/server with suitable resources. IPTV stream availability and viewing rights vary; use only streams you are authorized to access.

## Deploy to Vercel
1. Upload these files to a GitHub repository.
2. Import the repository in Vercel.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `ITFM_AI_API_KEY` and `ITFM_AI_BASE_URL` for a compatible chat provider; `ITFM_AI_MODEL` if required by that provider.
   - `TMDB_API_KEY` for movie search.
   - `IPTV_M3U_URL` is optional; the default is the public IPTV-org playlist.
4. Redeploy after setting variables.
5. Test `/api/health`, then `/api/movies`, `/api/tv`, and the Chat tool.

For local development, use Node.js 18+ and Vercel CLI (`vercel dev`) because the API router uses Vercel serverless routing. `npm start` is not a local web server in this starter.

## Security
- Never put secrets into `index.html`, JavaScript shipped to the browser, screenshots, or a public repository.
- Do not upload a populated `.env` file. Use `.env.example` as a template.
- Rotate any key that has already been exposed.
- Add rate limiting and abuse protection before allowing public access to your own API.

## TMDB attribution
This product uses the TMDB API but is not endorsed or certified by TMDB. Follow TMDB's current API terms and attribution requirements.

## IPTV
IPTV-org aggregates publicly listed channel stream links; it does not guarantee availability or rights in every location. Channel URLs may stop working. Use legal/authorized streams only.

## ITFM AI API key management (new)
- Open `/keys.html` to sign up/sign in and create/revoke up to 10 active ITFM AI keys per account.
- Create a Supabase project and enable Email Auth.
- Run `supabase/schema.sql` in the Supabase SQL Editor.
- Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as server environment variables in Vercel. Never expose the service-role key in browser code or commit it to Git.
- Redeploy, then open `/keys.html`. The browser needs only the Supabase project URL and anon/publishable key.
- Newly created keys have the format `itfm_live_<random-secret>`. The full key is shown once; the database stores only a SHA-256 hash. Revocation is supported.
- `GET /api/key/verify` checks a key supplied via `X-ITFM-API-Key` and updates its last-used timestamp. This is a validation endpoint, not yet a universal gateway: add the same validation middleware to each protected AI endpoint before treating keys as authorization for chat/generation calls.
- Supabase Auth email confirmation may need to be completed before sign-in. Configure email/SMTP settings according to your Supabase plan.

### Key API routes
- `GET /api/keys` — list the signed-in user's active keys (metadata only)
- `POST /api/keys` with `{ "name": "My app" }` — create a key; full secret returned once
- `DELETE /api/keys` with `{ "id": "<key UUID>" }` — revoke one of your own keys
- `GET /api/key/verify` with `X-ITFM-API-Key: itfm_live_...` — validate a key

A key branded as ITFM AI is an application-issued credential, not an upstream provider key. Provider API keys remain server-side and are needed for the actual AI features. Add rate limits, usage metering, abuse monitoring and quotas before public launch.

## Deployment verification checklist
1. Deploy the repository root (the folder containing `index.html`, `api/`, `vercel.json`, and `package.json`).
2. Confirm `GET /api/health` returns JSON. A healthy response only confirms the router is online and environment variables are present; it does not prove every provider works.
3. Configure Supabase Auth and run the SQL schema before testing `/keys.html`.
4. Sign up with an email/password, confirm the email if required, sign in, create a test key, copy it, then revoke it.
5. Test key validation with `GET /api/key/verify` and the header `X-ITFM-API-Key: <your-key>`.
6. Run `npm test` locally to check JavaScript syntax. Provider integrations require separate end-to-end tests with real credentials.

The Vercel catch-all route (`api/[...path].js`) forwards nested `/api/*` paths to the shared router. Deploy the contents of this folder as the repository root, not the parent folder.

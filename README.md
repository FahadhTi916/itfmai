# ITFM AI — API integration project

This project contains the ITFM AI front-end plus Vercel serverless API routes.

## Included
- `api/chat.js`: Groq chat completion route.
- `api/generate.js`: Hugging Face inference route for image, video, audio, music, cover and Genjutsu tasks. Configure a model ID compatible with the requested task; model schemas and availability differ.
- `api/movies.js`: TMDB movie search/popular catalogue with poster metadata.
- `api/channels.js`: IPTV-org channel directory and public stream lookup. A channel may have no stream, and playback depends on browser/region.
- `api/stem.js`: safe StemSplit setup guard. Requires the current account-specific upload/job schema before real processing can be enabled.
- `api/health.js`: reports whether secrets/model IDs are configured without exposing secret values.
- `index.html`: responsive front-end wired to the server routes.
- `.env.example`: names of required server-side settings; contains placeholders only.

## Deploy on Vercel
1. Push the project files to a private or public Git repository.
2. Import the repository in Vercel.
3. Add the variables listed in `.env.example` under Project → Settings → Environment Variables.
4. Select Hugging Face models that explicitly support each task. Some models require different request bodies, dedicated providers, or asynchronous job polling; the generic route will report errors rather than fabricate results.
5. Redeploy, then open `/api/health` to verify configuration flags.

## Security and limitations
- Never put real API keys in `index.html`, browser JavaScript, or a public repository.
- Do not upload content unless you have rights and consent.
- The generic Hugging Face route is suitable only for models accepting `{ inputs: prompt }` and returning media bytes or generated text. Model-specific adapters may be required for video, audio, music and cover workflows.
- StemSplit processing remains disabled until the provider's current documented request/upload format is supplied. The route does not pretend to process audio.
- IPTV-org is a public channel/stream directory, not a guarantee of channel availability or redistribution rights.
- TMDB metadata/artwork use must comply with TMDB terms and attribution requirements.

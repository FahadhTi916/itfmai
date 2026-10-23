# ITFM AI

Responsive AI tools dashboard with a server-side AI Chat endpoint for Vercel.

## Deploy

1. Upload the contents of this folder to your GitHub repository.
2. Import the repository into Vercel and deploy using the **Other** framework preset.
3. In Vercel, open **Project Settings → Environment Variables** and add:
   - `AI_API_KEY` — your AI provider API key (keep it secret; never add it to HTML or JavaScript).
   - `AI_MODEL` — optional model name. Defaults to `gpt-4o-mini`.
   - `AI_API_URL` — optional OpenAI-compatible chat completions endpoint. Defaults to `https://api.openai.com/v1/chat/completions`.
4. Redeploy after setting environment variables.
5. Open the AI Chat tool and send a test message.

## Important

- AI Chat is wired to `/api/chat`. It returns a clear setup message until `AI_API_KEY` is configured.
- API usage may incur charges with your chosen provider.
- The other generation tools have polished UI and local previews, but their actual image/video/audio generation requires separate provider integrations and credentials.
- File attachments are currently selected locally only; AI file/image analysis is not yet implemented.
- Movie and live TV listings are demo catalogue entries; no streaming URLs are bundled.

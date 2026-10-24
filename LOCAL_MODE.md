# ITFM AI API — Local / No API Key mode

This mode keeps `ITFM_AI_API_KEY=` and `TMDB_API_KEY=` empty. It is designed for running on your own computer, not on Vercel. It does **not** pretend that every modality works without its local model installed.

## What works in this starter

- Local web server at `http://127.0.0.1:8787`
- Local AI chat through Ollama (no cloud provider key)
- IPTV-org can still provide its public channel catalogue when the browser has internet access
- `/api/health` reports local server status

## Start on Windows

1. Install Python 3.10+.
2. Install Ollama from its official website: https://ollama.com
3. Open Command Prompt and run:
   ```bat
   ollama pull qwen2.5:3b
   ```
4. Open this project folder and run:
   ```bat
   start-local.bat
   ```
5. Open `http://127.0.0.1:8787` in your browser.

## Start on macOS / Linux

Install Python 3.10+ and Ollama, then run:
```sh
ollama pull qwen2.5:3b
python3 local_server.py
```
Open `http://127.0.0.1:8787`.

## Important limitations

- The included local backend exposes `/api/chat` for Ollama. The existing cloud-oriented dashboard still contains Supabase-auth/storage calls and modality controls; this starter does not silently replace those with fake implementations. To use local chat in the dashboard, the frontend chat adapter must call `POST /api/chat` with `{ "messages": [...] }`.
- Image generation needs a local image runtime (for example, ComfyUI with a suitable model). Video and music generation need their own compatible local models and enough hardware. Audio transcription/voice and STEM separation need local speech tools/Demucs. AI Cover requires a local RVC inference setup and a voice model you are allowed to use.
- TMDB search cannot work without TMDB credentials. IPTV channel availability depends on the third-party streams and internet access.
- Running the server on `127.0.0.1` limits access to your own computer. Do not expose it to the public internet without authentication and security hardening.
- “No API key” does not mean “no software/model downloads”, “no internet needed”, or “all features are free/unlimited”. Model licences, storage, RAM, GPU and bandwidth still apply.

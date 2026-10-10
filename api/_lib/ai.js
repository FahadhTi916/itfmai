/**
 * ITFM AI - single-key gateway
 *
 * The only secret used by this project is:
 *   ITFMAI_API_KEY
 *
 * Optional:
 *   ITFMAI_API_URL (the URL of the user's ITFM AI gateway)
 *
 * No individual model/provider API keys are accepted or required.
 */

const key = () => process.env.ITFMAI_API_KEY || '';
const geminiKey = () => process.env.GEMINI_API_KEY || '';
const baseUrl = () =>
  (process.env.ITFMAI_API_URL || process.env.ITFMAI_API_BASE_URL || '').replace(/\/+$/, '');

export const configured = () => Boolean((key() && baseUrl()) || geminiKey());
export const available = configured;
export const keys = Object.freeze({ ITFMAI_API_KEY: Boolean(key()), GEMINI_API_KEY: Boolean(geminiKey()) });

function unavailable(feature) {
  if (!key()) return `ITFMAI_API_KEY is not configured for ${feature}.`;
  if (!baseUrl()) return `ITFMAI_API_URL is not configured for ${feature}.`;
  return `${feature} gateway is unavailable.`;
}

export { unavailable };

function buildUrl(path = '/v1/generate') {
  const base = baseUrl();
  if (!base) throw Object.assign(new Error(unavailable('ITFM AI')), { status: 503 });
  let route = path.startsWith('/') ? path : `/${path}`;
  // Prevent the common /v1/v1/... mistake when the saved base URL already ends in /v1.
  if (/\/v1$/i.test(base) && /^\/v1(?:\/|$)/i.test(route)) route = route.slice(3) || '/';
  return `${base}${route}`;
}

async function request(path, payload, options = {}) {
  if (!key()) throw Object.assign(new Error(unavailable(options.feature || 'AI')), { status: 503 });
  if (!baseUrl()) throw Object.assign(new Error(unavailable(options.feature || 'AI')), { status: 503 });

  const response = await fetch(buildUrl(path), {
    method: options.method || 'POST',
    headers: {
      'Authorization': `Bearer ${key()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.method === 'GET' ? undefined : JSON.stringify(payload ?? {})
  });

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch { data = { raw: text }; }

  if (!response.ok) {
    const message = data?.error?.message || data?.error || data?.message ||
      `${options.feature || 'AI'} gateway returned ${response.status}.`;
    throw Object.assign(new Error(String(message)), { status: response.status, data });
  }
  return data;
}

export async function operationStatus(id) {
  return request(`/v1/status/${encodeURIComponent(id)}`, null, {
    method: 'GET', feature: 'Generation status'
  });
}

export async function chat(payload) {
  // Use Gemini directly for chat when GEMINI_API_KEY is configured.
  // The key remains server-side and is never sent to the browser.
  if (geminiKey()) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey())}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { text: String(payload?.message || payload?.prompt || '') },
          ...(payload?.imageData && payload?.mimeType ? [{ inline_data: { mime_type: payload.mimeType, data: String(payload.imageData).replace(/^data:[^,]+,/, '') } }] : [])
        ] }]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data?.error?.message || `Gemini Chat returned ${response.status}.`;
      throw Object.assign(new Error(msg), { status: response.status, data });
    }
    const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!text) throw Object.assign(new Error('Gemini returned no text response.'), { status: 502 });
    return { text, provider: 'Google Gemini' };
  }
  return request('/v1/chat', payload, { feature: 'Chat' });
}

export async function image(payload) {
  return request('/v1/image', payload, { feature: 'Image generation' });
}

export async function music(payload) {
  return request('/v1/music', payload, { feature: 'Music generation' });
}

export async function video(payload) {
  return request('/v1/video', payload, { feature: 'Video generation' });
}

export async function tts(payload) {
  return request('/v1/tts', payload, { feature: 'Text-to-speech' });
}

export async function cover(payload) {
  return request('/v1/cover', payload, { feature: 'Cover generation' });
}

export async function avatar(payload) {
  return request('/v1/avatar', payload, { feature: 'Avatar generation' });
}

export async function transcribe(payload) {
  return request('/v1/transcribe', payload, { feature: 'Transcription' });
}

export async function backgroundRemove(payload) {
  return request('/v1/background-remove', payload, { feature: 'Background removal' });
}

export async function karaokeRemove(payload) {
  return request('/v1/karaoke-remove', payload, { feature: 'Karaoke processing' });
}

export async function generate(payload) {
  return request('/v1/generate', payload, { feature: 'Generation' });
}

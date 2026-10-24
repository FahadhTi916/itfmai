(() => {
  const cfg = window.ITFM_CONFIG || {};
  let client = null;
  const $ = (id) => document.getElementById(id);
  const status = (text) => {
    const el = $("itfm-auth-status");
    if (el) el.textContent = text;
  };
  function ready() {
    if (!window.supabase || !cfg.supabaseUrl || cfg.supabaseUrl.includes("YOUR_PROJECT") ||
        !cfg.supabaseAnonKey || cfg.supabaseAnonKey.includes("YOUR_SUPABASE")) {
      throw new Error("Configure config.js with your Supabase project URL and anon key first.");
    }
    if (!client) client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return client;
  }
  async function session() {
    const { data, error } = await ready().auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error("Please sign in first. Use the Sign in / Create account panel.");
    return data.session;
  }
  async function invoke(name, options) {
    const s = await session();
    const response = await fetch(`${cfg.functionsBaseUrl}/${name}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.supabaseAnonKey,
        "Authorization": `Bearer ${s.access_token}`,
        ...(options?.headers || {})
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body;
  }
  async function initAuth() {
    const top = document.querySelector(".top-right");
    if (!top || $("itfm-auth-panel")) return;
    const panel = document.createElement("div");
    panel.id = "itfm-auth-panel";
    panel.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:440px";
    panel.innerHTML = `
      <input id="itfm-auth-email" type="email" placeholder="Email" aria-label="Email" style="width:145px;padding:8px;border-radius:8px">
      <input id="itfm-auth-password" type="password" placeholder="Password" aria-label="Password" style="width:120px;padding:8px;border-radius:8px">
      <button id="itfm-signin" type="button" class="btn">Sign in</button>
      <button id="itfm-signup" type="button" class="btn">Create account</button>
      <button id="itfm-signout" type="button" class="btn" hidden>Sign out</button>
      <small id="itfm-auth-status" role="status" style="color:#c4b5fd;max-width:100%;font-size:11px">Configure Supabase to enable account access.</small>`;
    top.prepend(panel);
    const authAction = async (kind) => {
      try {
        const c = ready();
        const email = $("itfm-auth-email").value.trim();
        const password = $("itfm-auth-password").value;
        if (!email || password.length < 8) throw new Error("Enter an email and a password of at least 8 characters.");
        const result = kind === "signup"
          ? await c.auth.signUp({ email, password })
          : await c.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        status(kind === "signup" && !result.data.session ? "Check your email to confirm the account." : `Signed in as ${email}`);
        await refreshAuth();
      } catch (e) { status(e.message || "Authentication failed"); }
    };
    $("itfm-signin").onclick = () => authAction("signin");
    $("itfm-signup").onclick = () => authAction("signup");
    $("itfm-signout").onclick = async () => {
      try { const { error } = await ready().auth.signOut(); if (error) throw error; status("Signed out"); await refreshAuth(); }
      catch (e) { status(e.message); }
    };
    try {
      ready().auth.onAuthStateChange((_event, s) => {
        status(s?.user ? `Signed in: ${s.user.email}` : "Not signed in");
        $("itfm-signout").hidden = !s?.user;
        $("itfm-signin").hidden = !!s?.user;
        $("itfm-signup").hidden = !!s?.user;
      });
      await refreshAuth();
    } catch (e) { status(e.message); }
  }
  async function refreshAuth() {
    const { data } = await ready().auth.getSession();
    const signedIn = !!data.session;
    if ($("itfm-signout")) $("itfm-signout").hidden = !signedIn;
    if ($("itfm-signin")) $("itfm-signin").hidden = signedIn;
    if ($("itfm-signup")) $("itfm-signup").hidden = signedIn;
    if (signedIn) status(`Signed in: ${data.session.user.email}`);
  }
  async function saveUpload(file, bucket = "media-inputs") {
    const c = ready();
    const s = await session();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${s.user.id}/${Date.now()}-${cleanName}`;
    const { error } = await c.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
    if (error) throw error;
    return path;
  }
  async function signedUrl(bucket, path) {
    const { data, error } = await ready().storage.from(bucket).createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  }
  async function uploadInput(file) { return saveUpload(file, "media-inputs"); }
  async function inputSignedUrl(path) { return signedUrl("media-inputs", path); }
  async function runMedia(task) {
    const input = task === "stem" ? $("stem-file") : $("cover-file");
    const file = input?.files?.[0];
    if (!file) throw new Error("Choose an audio file first.");
    if (file.size > 100 * 1024 * 1024) throw new Error("File must be 100 MB or smaller.");
    const path = await saveUpload(file);
    const inputUrl = await signedUrl("media-inputs", path);
    const result = await invoke("media-proxy", { method: "POST", body: JSON.stringify({ task, input_url: inputUrl, voice_model: $("cover-voice-model")?.value.trim() || undefined }) });
    if (result.path && result.bucket) {
      const url = await signedUrl(result.bucket, result.path);
      const box = $(task === "stem" ? "stem-preview" : "cover-preview");
      if (box) {
        box.innerHTML = "";
        const a = document.createElement("a");
        a.href = url; a.download = ""; a.textContent = "Download processed ZIP";
        a.className = "btn primary";
        box.appendChild(a);
        const p = document.createElement("p"); p.textContent = (result.stems || []).join(", "); box.appendChild(p);
      }
    }
    return result;
  }
  window.itfmApi = {
    invoke,
    async chat(messages) { return invoke("ai-chat", { method: "POST", body: JSON.stringify({ messages }) }); },
    async generate(feature, prompt, options = {}) {
      return invoke("ai-generate", { method: "POST", body: JSON.stringify({ feature, prompt, options }) });
    },
    async tmdb(path, params = {}) {
      const q = new URLSearchParams({ path, ...params });
      return invoke(`tmdb?${q.toString()}`, { method: "GET", headers: { "Content-Type": "application/json" } });
    },
    runMedia,
    uploadInput,
    inputSignedUrl,
    initAuth
  };
  document.addEventListener("DOMContentLoaded", initAuth);
})();

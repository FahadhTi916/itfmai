(function(){
'use strict';
const root=document.querySelector('#app'), toastEl=document.querySelector('#toast');
const STORE='itfmai-local-v4', THEME='itfmai-theme';
const tools=[
['image','AI Image Studio','Create, edit, enhance and upscale images','image/*'],['video','AI Video Studio','Text-to-video, image-to-video and video workflows','image/*,video/*'],['audio','Audio & Voice','Text-to-speech, speech-to-text and voice tools','audio/*'],['music','AI Music','Create songs, instrumentals and soundtracks','audio/*'],['cover','AI Cover / Karaoke','Prepare karaoke tracks, lyrics and vocal settings','audio/*'],['chat','AI Chat','Chat, voice and file conversations','*/*'],['genjutsu','Genjutsu AI','Advanced image/video creative workspace','image/*,video/*']
];
const state={page:(location.hash||'#dashboard').slice(1)||'dashboard', files:[], user:null};
function load(){try{return JSON.parse(localStorage.getItem(STORE))||{projects:[],assets:[],history:[],drafts:[]}}catch(e){return{projects:[],assets:[],history:[],drafts:[]}}}
let db=load();
function save(){try{localStorage.setItem(STORE,JSON.stringify(db))}catch(e){toast('Browser storage is full. Export or remove some assets.')}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>toastEl.classList.remove('show'),2600)}
// Daily quota cooldown: when the configured provider reports an exhausted quota,
// pause API POST requests in this browser until midnight Asia/Kolkata, then retry.
// This is a client-side convenience; the provider controls its actual quota reset.
const QUOTA_LOCK_KEY='itfmai-quota-lock-v1';
function nextIndiaMidnight(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));return Date.UTC(Number(v.year),Number(v.month)-1,Number(v.day)+1)-330*60*1000}
function quotaLock(){try{const lock=JSON.parse(localStorage.getItem(QUOTA_LOCK_KEY)||'null');if(lock&&Date.now()<lock.until)return lock;localStorage.removeItem(QUOTA_LOCK_KEY)}catch{}return null}
function isAiPost(input,init){const method=String(init?.method||input?.method||'GET').toUpperCase();const url=typeof input==='string'?input:(input?.url||'');return method==='POST'&&/\/api\/(chat|generate|tts|cover|transcribe|providers|media)(?:[/?#]|$)/i.test(url)}
const originalFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  if(isAiPost(input,init)){const lock=quotaLock();if(lock){return new Response(JSON.stringify({error:`Today's AI quota has been reached. ITFM AI will allow another attempt after midnight India time (${new Date(lock.until).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}).`}),{status:429,headers:{'Content-Type':'application/json'}})}}
  const response=await originalFetch(input,init);
  if(isAiPost(input,init)){let body='';try{body=await response.clone().text()}catch{}const low=body.toLowerCase();if(response.status===429||/quota exceeded|quota exhausted|resource_exhausted|daily limit|rate limit exceeded|insufficient quota/.test(low)){try{localStorage.setItem(QUOTA_LOCK_KEY,JSON.stringify({until:nextIndiaMidnight(),since:Date.now()}))}catch{}}}
  return response;
};
function id(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2)}
function themeButton(){const light=document.documentElement.dataset.theme==='light';return `<button class="theme-switch ${light?'is-light':'is-dark'}" id="themeToggle" type="button" aria-label="Toggle appearance"><span class="theme-label">${light?'LIGHT':'DARK'}</span><span class="theme-dot"></span></button>`}
function bindTheme(){const b=document.querySelector('#themeToggle');if(!b)return;b.onclick=()=>{const light=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=light?'light':'dark';localStorage.setItem(THEME,light?'light':'dark');b.classList.toggle('is-light',light);b.classList.toggle('is-dark',!light);b.querySelector('.theme-label').textContent=light?'LIGHT':'DARK'}}
function icon(type){const k=String(type||'').toLowerCase();const map={image:'M4 5h16v14H4z M7 15l3-3 2 2 2-3 3 4',video:'M4 6h12v12H4z M16 10l4-3v10l-4-3z',avatar:'M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm-6 7a6 6 0 0 1 12 0',character:'M7 4h10v16H7z M9 8h6 M9 12h6 M9 16h4',animation:'M5 6h14v12H5z M9 6v12 M14 6v12',effects:'M12 3l2.4 6.1L21 11.5l-6.6 2.4L12 21l-2.4-7.1L3 11.5l6.6-2.4z',audio:'M6 10v4 M10 7v10 M14 5v14 M18 9v6',music:'M9 18V6l9-2v12 M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm9-2a3 3 0 1 1-3-3',cover:'M5 8h14M5 12h10M5 16h14',tryon:'M8 4l4 3 4-3 4 5-3 3v8H7v-8L4 9z',design:'M4 5h16v14H4z M8 9h8 M8 13h5',chat:'M4 5h16v11H8l-4 3z',genjutsu:'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4',socially:'M5 5h14v14H5z M8 9h8 M8 12h5 M8 15h7','image-bg-remover':'M4 5h16v14H4z M7 16l3-4 3 2 2-3 3 5', 'video-bg-remover':'M4 6h12v12H4z M16 10l4-3v10l-4-3z M8 9h4 M8 12h4','karaoke-remover':'M5 8h14M8 5v14M12 5v14M16 5v14','audio-remover':'M4 6h12v12H4z M16 10h4v4h-4z'};const d=map[k]||'M5 12h14 M12 5v14';return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`}
function footer(){return '<footer class="site-footer"><span>ITFM AI</span><i>—</i><strong>Creative workspace</strong><span class="footer-note">Built for focused creation</span></footer>'}
function shell(){return `<div class="layout"><aside class="sidebar" id="side"><div class="brand"><span class="brand-logo" aria-hidden="true">IF</span><div><span class="brand-text">ITFM AI</span><small>CREATIVE AI OS</small></div></div><nav class="nav"><div class="nav-label">CREATE</div><button data-nav="dashboard">${icon('dashboard')}<span>Dashboard</span></button>${tools.map(t=>`<button data-nav="${t[0]}">${icon(t[0])}<span>${t[1]}</span></button>`).join('')}<div class="nav-label">MANAGE</div><button data-nav="projects">${icon('design')}<span>Projects</span></button><button data-nav="assets">${icon('image')}<span>Asset Library</span></button><button data-nav="history">${icon('audio')}<span>Generation History</span></button></nav><div class="side-owner"><span class="owner-mark">M</span><div><small>Workspace</small><b>Admin</b></div></div></aside><div class="mobile-overlay" id="overlay"></div><main class="main"><header class="topbar"><button class="btn hamb" id="hamb" aria-label="Open navigation">${icon('menu')}</button><div class="mobile-brand" aria-label="ITFM AI"><span class="mobile-brand-mark">IF</span><span>ITFM AI</span></div><div class="top-search">${icon('search')}<input aria-label="Search" placeholder="Search tools, projects, assets..."></div><div class="top-actions"><button class="icon-btn" aria-label="Notifications">${icon('bell')}</button>${themeButton()}</div></header><section class="content" id="view"></section>${footer()}</main></div>`}
function fmt(n){return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`}
function footer(){return '<footer class="site-footer"><div class="footer-brand"><span>ITFM AI</span><i>—</i><strong>Creative AI Workspace</strong></div><nav class="footer-socials" aria-label="Social links"><a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">YouTube</a><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.google.com/" target="_blank" rel="noopener noreferrer">Website</a></nav></footer>'}
function shell(){return `<div class="layout"><aside class="sidebar" id="side"><div class="brand" id="homeBrand" role="button" tabindex="0" aria-label="Go to home"><span class="brand-logo" aria-hidden="true">IF</span><div><span class="brand-text">ITFM AI</span><small>CREATIVE AI OS</small></div></div><nav class="nav"><div class="nav-label">AI STUDIOS</div>${tools.map(t=>`<button data-nav="${t[0]}">${icon(t[0])} <span>${t[1]}</span></button>`).join('')}</nav><div class="side-owner auth-owner"><span class="owner-avatar">MS</span><div><small>WORKSPACE</small><b>ITFM AI</b></div></div></aside><div class="mobile-overlay" id="overlay"></div><main class="main"><header class="topbar"><button class="btn hamb" id="hamb" aria-label="Open navigation">☰</button><div class="mobile-brand" id="mobileHome" aria-label="ITFM AI"><span class="mobile-brand-mark">IF</span><span>ITFM AI</span></div><div class="top-search"><span>⌕</span><input aria-label="Search" placeholder="Search the 7 AI studios..."></div><div class="top-actions"><button class="icon-btn" aria-label="Notifications">♧</button>${themeButton()}</div></header><section class="content" id="view"></section>${footer()}</main></div>`}
function titleFor(p){if(p==='dashboard')return'Dashboard';if(p==='projects')return'Projects';if(p==='assets')return'Asset Library';if(p==='history')return'Generation History';return (tools.find(t=>t[0]===p)||['',p])[1]}
function fileBox(inputId,accept='*/*',multiple=true,label='Drop files here or tap to browse'){return `<div class="upload" data-drop="${inputId}"><div class="upload-icon">${icon('upload')}</div><b>${label}</b><span>JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, MP3, WAV, M4A, OGG, PDF, DOCX, TXT, CSV, XLSX, PPTX, MD, JSON</span><input id="${inputId}" type="file" accept="${accept}" ${multiple?'multiple':''}><div class="file-list" id="${inputId}-list"></div></div>`}
function bindFiles(inputId,multiple=true,onChange){const input=document.getElementById(inputId),box=document.querySelector(`[data-drop="${inputId}"]`);if(!input||!box)return;const add=files=>{state.files=multiple?files:files.slice(0,1);renderFiles(inputId);if(onChange)onChange(state.files)};input.onchange=()=>add([...input.files]);box.ondragover=e=>{e.preventDefault();box.classList.add('drag')};box.ondragleave=()=>box.classList.remove('drag');box.ondrop=e=>{e.preventDefault();box.classList.remove('drag');add([...e.dataTransfer.files])}}
function renderFiles(inputId){const el=document.getElementById(inputId+'-list');if(!el)return;el.innerHTML=state.files.map((f,i)=>`<div class="file-row"><span>${icon(f.type)}</span><b>${esc(f.name)}</b><small>${fmt(f.size)}</small><button type="button" data-rm="${i}">×</button></div>`).join('');el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=e=>{e.stopPropagation();state.files.splice(+b.dataset.rm,1);renderFiles(inputId)})}
const ASSET_DB='itfmai-assets-v1';
function assetDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(ASSET_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('blobs'))r.result.createObjectStore('blobs')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function putAssetBlob(id,blob){try{const d=await assetDB();await new Promise((resolve,reject)=>{const tx=d.transaction('blobs','readwrite');tx.objectStore('blobs').put(blob,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});d.close()}catch{} }
async function getAssetBlob(id){try{const d=await assetDB();const out=await new Promise((resolve,reject)=>{const tx=d.transaction('blobs','readonly');const r=tx.objectStore('blobs').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});d.close();return out}catch{return null}}
async function deleteAssetBlob(id){try{const d=await assetDB();await new Promise((resolve,reject)=>{const tx=d.transaction('blobs','readwrite');tx.objectStore('blobs').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});d.close()}catch{} }
function addAsset(file,source='upload'){const url=URL.createObjectURL(file);const a={id:id(),name:file.name,type:file.type,size:file.size,url,source,created:Date.now(),persistent:true};db.assets.unshift(a);db.assets=db.assets.slice(0,100);save();putAssetBlob(a.id,file);return a}
async function hydrateAssets(){for(const a of db.assets){if(a.persistent){const blob=await getAssetBlob(a.id);if(blob){if(a.url&&a.url.startsWith('blob:'))URL.revokeObjectURL(a.url);a.url=URL.createObjectURL(blob)}}}}
function saveHistory(type,prompt,status='draft',extra={}){db.history.unshift({id:id(),type,prompt,status,created:Date.now(),...extra});db.history=db.history.slice(0,200);save()}
function dashboard(v){v.innerHTML=`<div class="dashboard-tools">${tools.map(t=>`<button class="tool-tile tool-${t[0]}" data-go="${t[0]}"><div class="tool-photo"><img src="assets/${t[0]==='socially'?'social-media-tools':(t[0]==='image-bg-remover'?'image-bg-remover':(t[0]==='video-bg-remover'?'video-bg-remover':t[0]))}.svg" alt="${esc(t[1])}"></div><span class="tile-badge">${t[0]==='socially'?'SOCIAL':'AI TOOL'}</span><div class="tile-text"><h3>${t[1]}</h3><p>${t[2]}</p></div><span class="tile-arrow">›</span></button>`).join('')}</div>`;v.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>route(b.dataset.go))}
function providerNotice(name){return `<div class="notice"><b>Real AI provider routing enabled</b><span>${esc(name)} uses the configured external AI service, external AI service, external AI service, external AI service and external video service server-side keys. If none is configured, the app shows a clear unavailable error.</span></div>`}
function localPreview(files){if(!files.length)return '<div class="empty"><div class="big-icon"></div><b>No input selected</b><p>Upload an input file to preview it here.</p></div>';return files.map(f=>{const u=URL.createObjectURL(f);if(f.type.startsWith('image/'))return `<img class="local-preview-img" src="${u}" alt="${esc(f.name)}">`;if(f.type.startsWith('video/'))return `<video class="local-preview-media" src="${u}" controls></video>`;if(f.type.startsWith('audio/'))return `<audio class="local-preview-audio" src="${u}" controls></audio>`;return `<div class="file-preview"><div class="big-icon">${icon(f.type)}</div><b>${esc(f.name)}</b><p>${esc(f.type||'file')} • ${fmt(f.size)}</p></div>`}).join('')}
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(file)})}
function saveGeneratedData(src,mime,name){fetch(src).then(r=>r.blob()).then(blob=>{const f=new File([blob],name,{type:mime});addAsset(f,'ai-generated');toast('Saved to Asset Library')}).catch(()=>toast('Could not save generated asset'))}
function renderMediaResult(result,data,type,prompt){const url=data.url;const provider=data.provider||'provider';if(data.kind==='image'){const src=String(url).startsWith('data:')?url:`/api/media?url=${encodeURIComponent(url)}`;result.innerHTML=`<img class="local-preview-img" src="${esc(src)}" alt="Generated result"><div class="row"><a class="btn primary" href="${esc(src)}" target="_blank" download="itfmai-image-${Date.now()}.png">Open / Download</a></div>`;saveHistory(type,prompt,'completed',{provider});toast('Image generated successfully');return}if(data.kind==='audio'){const playable=String(url).startsWith('data:')?url:url;result.innerHTML=`<audio class="local-preview-audio" src="${esc(playable)}" controls></audio><div class="row"><a class="btn primary" href="${esc(playable)}" download="itfmai-audio-${Date.now()}.mp3">Download</a></div>`;saveHistory(type,prompt,'completed',{provider});toast('Audio generated successfully');return}const playableUrl=String(url).startsWith('https://removed-media-source/')?`/api/media?url=${encodeURIComponent(url)}`:url;result.innerHTML=`<video class="local-preview-media" src="${esc(playableUrl)}" controls playsinline></video><div class="row"><a class="btn primary" href="${esc(playableUrl)}" target="_blank" rel="noopener" download="itfmai-video-${Date.now()}.mp4">Open / Download</a></div>`;saveHistory(type,prompt,'completed',{provider});toast('Video generated successfully')}
function renderVideoResult(result,url,type,prompt){renderMediaResult(result,{kind:'video',url,provider:'provider'},type,prompt)}
function pollGeneration(provider,id,result,type,prompt,attempt=0,model=''){if(!id){result.innerHTML='<div class="notice"><b>Provider returned no job ID.</b></div>';return}if(attempt>80){result.innerHTML='<div class="notice"><b>Generation is taking longer than this page will wait.</b><span>The provider job is still real and can be checked again later.</span></div>';saveHistory(type,prompt,'timeout',{provider});return}setTimeout(async()=>{try{const q=`/api/status?provider=${encodeURIComponent(provider)}&id=${encodeURIComponent(id)}&model=${encodeURIComponent(model||'')}`;const r=await fetch(q);const d=await r.json();if(!r.ok)throw new Error(d.error||'Status check failed');if(d.status==='completed'&&(d.url||d.kind)){renderMediaResult(result,{kind:d.kind||'video',url:d.url,provider},type,prompt);return}if(d.status==='failed')throw new Error(d.error||'Provider generation failed.');const n=result.querySelector('.notice span');if(n)n.textContent=`Provider status: ${d.status||'processing'}…`;pollGeneration(provider,id,result,type,prompt,attempt+1,model)}catch(e){result.innerHTML=`<div class="notice"><b>${esc(e.message)}</b><span>No fake output was generated.</span></div>`;saveHistory(type,prompt,'failed',{provider})}},Math.min(15000,3500+attempt*500))}

async function loadExternalScript(src){
  if(document.querySelector(`script[data-external-src="${src}"]`)) return;
  await new Promise((resolve,reject)=>{
    const el=document.createElement('script'); el.src=src; el.async=true; el.crossOrigin='anonymous'; el.dataset.externalSrc=src;
    el.onload=resolve; el.onerror=()=>reject(new Error(`Could not load ${src}`)); document.head.appendChild(el);
  });
}

let imglyRemovalPromise=null;
async function getImglyRemoval(){
  if(!imglyRemovalPromise){
    imglyRemovalPromise=import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm').then(m=>m.removeBackground||m.default);
  }
  const fn=await imglyRemovalPromise;
  if(typeof fn!=='function') throw new Error('Free browser background-removal engine could not be loaded.');
  return fn;
}

async function rasterizeSvgForRemoval(file){
  const svgText=await file.text();
  const blob=new Blob([svgText],{type:'image/svg+xml'});
  const url=URL.createObjectURL(blob);
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Could not read the SVG file.'));img.src=url;});
    const max=2048, scale=Math.min(1,max/Math.max(img.naturalWidth||1024,img.naturalHeight||1024));
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round((img.naturalWidth||1024)*scale)); canvas.height=Math.max(1,Math.round((img.naturalHeight||1024)*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    return await new Promise(resolve=>canvas.toBlob(resolve,'image/png',0.98));
  } finally { URL.revokeObjectURL(url); }
}

function transparentPngAsSvg(blobUrl,width=1024,height=1024){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${blobUrl}" width="${width}" height="${height}" preserveAspectRatio="none"/></svg>`;
}

async function removeImageBackgroundLocally(file,result){
  const removeBackground=await getImglyRemoval();
  const sourceFile=file.type==='image/svg+xml'?await rasterizeSvgForRemoval(file):file;
  result.innerHTML='<div class="notice"><b>Removing background on this device…</b><span>The free local AI model is downloading the first time only. Your image is not uploaded.</span></div>';
  const blob=await removeBackground(sourceFile,{
    model:'medium',
    device:'cpu',
    proxyToWorker:true,
    output:{format:'image/png',quality:0.95},
    progress:(key,current,total)=>{
      const el=result.querySelector('span');
      if(el && total) el.textContent=`${key.replace(/^compute:/,'').replace(/[-_]/g,' ')} — ${Math.round((current/total)*100)}%`; 
    }
  });
  const url=URL.createObjectURL(blob);
  result.innerHTML=`<img class="local-preview-img transparent-preview" src="${esc(url)}" alt="Background removed result"><div class="row"><a class="btn primary" href="${esc(url)}" download="itfmai-image-bg-removed-${Date.now()}.png">Download PNG</a><button class="btn" id="downloadBgSvg">Download SVG</button><button class="btn" id="saveBgAsset">Save to Assets</button><button class="btn" id="bgAgain">Remove Another</button></div><div class="notice"><b>SVG export</b><span>The SVG contains the transparent result as an embedded image. It is not a true vector trace.</span></div>`;
  document.querySelector('#saveBgAsset').onclick=()=>saveGeneratedData(url,'image/png','itfmai-image-bg-removed.png');
  document.querySelector('#downloadBgSvg').onclick=()=>{const svg=transparentPngAsSvg(url);const blob=new Blob([svg],{type:'image/svg+xml'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`itfmai-image-bg-removed-${Date.now()}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
  document.querySelector('#bgAgain').onclick=()=>{state.files=[];renderFiles('bgFiles');result.innerHTML='<div class="empty"><b>Upload another image.</b></div>'};
  return url;
}

let selfieSegPromise=null;
async function getSelfieSegmentation(){
  if(!selfieSegPromise){
    selfieSegPromise=(async()=>{
      await loadExternalScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js');
      if(!window.SelfieSegmentation) throw new Error('Free video segmentation engine could not be loaded.');
      return window.SelfieSegmentation;
    })();
  }
  return selfieSegPromise;
}

async function removeVideoBackgroundLocally(file,result){
  if(!window.MediaRecorder) throw new Error('This browser does not support local video export. Try Chrome/Edge on Android or desktop.');
  if(!HTMLCanvasElement.prototype.captureStream) throw new Error('This browser does not support canvas video export.');
  const SelfieSegmentation=await getSelfieSegmentation();
  result.innerHTML='<div class="notice"><b>Preparing free local video background removal…</b><span>The video stays on this device. Processing is real-time and may take about the video duration.</span></div>';
  const sourceUrl=URL.createObjectURL(file);
  const video=document.createElement('video'); video.src=sourceUrl; video.muted=true; video.playsInline=true; video.preload='auto';
  await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('Could not read the selected video.'));});
  const maxW=1280, scale=Math.min(1,maxW/video.videoWidth), width=Math.max(2,Math.round(video.videoWidth*scale)), height=Math.max(2,Math.round(video.videoHeight*scale));
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:false});
  const Selfie=SelfieSegmentation;
  const segmenter=new Selfie({locateFile:(name)=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${name}`});
  segmenter.setOptions({modelSelection:1});
  let latestMask=null, recording=false, stopped=false;
  segmenter.onResults((r)=>{
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(r.image,0,0,width,height);
    ctx.globalCompositeOperation='destination-in';
    ctx.drawImage(r.segmentationMask,0,0,width,height);
    ctx.globalCompositeOperation='source-over';
    latestMask=true;
  });
  const stream=canvas.captureStream(30);
  try{video.captureStream().getAudioTracks().forEach(track=>stream.addTrack(track));}catch{}
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime) throw new Error('This browser cannot export WebM video.');
  const chunks=[]; const recorder=new MediaRecorder(stream,{mimeType:mime});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  const done=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error('Video recording failed.'))});
  const processFrame=async()=>{
    if(stopped || video.ended) return;
    try{await segmenter.send({image:video});}catch(e){stopped=true;try{recorder.stop()}catch{};throw e;}
    const p=result.querySelector('#videoLocalProgress'); if(p && video.duration) p.textContent=`${Math.min(100,Math.round((video.currentTime/video.duration)*100))}%`;
    if(video.requestVideoFrameCallback) video.requestVideoFrameCallback(()=>processFrame()); else requestAnimationFrame(processFrame);
  };
  result.innerHTML=`<div class="notice"><b>Removing video background locally…</b><span>Progress: <strong id="videoLocalProgress">0%</strong>. Do not close this page.</span></div><video class="local-preview-media" src="${esc(sourceUrl)}" controls muted playsinline></video>`;
  recorder.start(250); recording=true;
  video.onended=()=>{stopped=true;if(recording){recording=false;try{recorder.stop()}catch{}}};
  await video.play();
  await processFrame();
  await done;
  segmenter.close?.();
  stream.getTracks().forEach(t=>t.stop());
  URL.revokeObjectURL(sourceUrl);
  const blob=new Blob(chunks,{type:mime});
  if(!blob.size) throw new Error('No output video was produced.');
  const outUrl=URL.createObjectURL(blob);
  result.innerHTML=`<video class="local-preview-media transparent-preview" src="${esc(outUrl)}" controls playsinline></video><div class="row"><a class="btn primary" href="${esc(outUrl)}" download="itfmai-video-bg-removed-${Date.now()}.webm">Download Transparent WebM</a><button class="btn" id="saveVideoAsset">Save to Assets</button></div><div class="notice"><b>Local result ready</b><span>Output is WebM. Transparency support depends on the browser/player.</span></div>`;
  document.querySelector('#saveVideoAsset').onclick=()=>saveGeneratedData(outUrl,'video/webm','itfmai-video-bg-removed.webm');
  return outUrl;
}

function backgroundRemover(v,t){
  const isVideo=t[0]==='video-bg-remover';
  const accept=isVideo?'video/mp4,video/quicktime,video/webm':'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';
  const label=isVideo?'Upload a video to remove its background':'Upload a photo or SVG to remove its background';
  const output=isVideo?'Transparent WebM (free local)':'Transparent PNG (free local)';
  v.innerHTML=`<div class="section-head"><div><span class="eyebrow">BACKGROUND REMOVAL</span><h2>${esc(t[1])}</h2><p class="muted">${esc(t[2])}</p></div><span class="status-pill">FREE LOCAL + API FALLBACK</span></div>
  <div class="grid two studio-layout"><div class="card form-card">
    <div class="notice"><b>Free mode available</b><span>${isVideo?'Video segmentation runs on your device; Chrome/Edge is recommended for WebM export.':'JPG, PNG, WEBP, GIF and SVG are supported. Image background removal runs locally in your browser with no API key and no upload.'}</span></div>
    <div class="notice unavailable"><b>Optional server API</b><span id="bgProviderStatus">Checking optional background-removal provider…</span></div>
    <form id="bgForm" class="form">
      <div class="field"><label>Prompt / Instructions</label><textarea name="prompt" placeholder="Describe how you want the background removed or the subject preserved..."></textarea></div>
      ${fileBox('bgFiles',accept,false,label)}
      <div class="grid two"><div class="field"><label>Aspect Ratio</label><select name="ratio"><option>1:1</option><option>16:9</option><option>9:16</option></select></div><div class="field"><label>Processing mode</label><select name="mode"><option value="local">Free Local AI — recommended</option><option value="api">Configured API</option></select></div></div>
      ${isVideo?`<div class="field"><label>Export</label><select name="output"><option>Transparent WebM</option><option>API provider output</option></select></div>`:`<div class="field"><label>Output</label><select name="output"><option>Transparent PNG</option><option>API provider output</option></select></div>`}
      <div class="row"><button class="btn primary" type="submit">Remove Background</button><button class="btn" type="button" id="bgPreview">Preview Input</button><button class="btn" type="button" id="bgClear">Clear</button></div>
    </form>
  </div><div class="card result-card"><div class="result-head"><h3>Result</h3><span>${isVideo?'TRANSPARENT VIDEO':'TRANSPARENT PNG'}</span></div><div class="preview" id="bgResult"><div class="empty"><div class="big-icon">${icon(t[0])}</div><b>Your result will appear here</b><p>Choose Free Local AI or a configured API.</p></div></div></div></div>`;
  bindFiles('bgFiles',false);
  const result=document.querySelector('#bgResult');
  document.querySelector('#bgPreview').onclick=()=>{result.innerHTML=localPreview(state.files)};
  document.querySelector('#bgClear').onclick=()=>{state.files=[];renderFiles('bgFiles');result.innerHTML='<div class="empty"><div class="big-icon">'+icon(t[0])+'</div><b>No input selected</b><p>Upload a file to begin.</p></div>'};
  fetch('/api/background-remove?status=1').then(r=>r.json()).then(d=>{
    document.querySelector('#bgProviderStatus').textContent=d.configured?'Optional server background-removal API is configured.':'No server API configured — Free Local AI is available.';
  }).catch(()=>{document.querySelector('#bgProviderStatus').textContent='No server API configured — Free Local AI is available.'});
  document.querySelector('#bgForm').onsubmit=async e=>{
    e.preventDefault(); const f=state.files?.[0]; if(!f){toast('Upload a file first');return}
    const btn=e.currentTarget.querySelector('button[type=submit]'); btn.disabled=true;
    const mode=e.currentTarget.querySelector('[name=mode]').value;
    const prompt=e.currentTarget.querySelector('[name=prompt]').value.trim();
    const ratio=e.currentTarget.querySelector('[name=ratio]').value;
    saveHistory(t[1],prompt||'Background removal','processing',{filename:f.name,mode,ratio});
    try{
      if(mode==='local'){
        if(isVideo) await removeVideoBackgroundLocally(f,result); else await removeImageBackgroundLocally(f,result);
        saveHistory(t[1],prompt||'Background removal','completed',{provider:'local-free',ratio}); toast('Background removed successfully');
      }else{
        result.innerHTML='<div class="notice"><b>Processing…</b><span>Waiting for the configured API. No fake progress is shown.</span></div>';
        const fd=new FormData(); fd.append('file',f); fd.append('kind',isVideo?'video':'image'); fd.append('prompt',prompt); fd.append('ratio',ratio);
        const r=await fetch('/api/background-remove',{method:'POST',body:fd}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Background removal API failed.');
        const url=d.url || (d.data?`data:${d.mimeType||'image/png'};base64,${d.data}`:''); if(!url) throw new Error('Provider returned no output.');
        if(isVideo) result.innerHTML=`<video class="local-preview-media" src="${esc(url)}" controls playsinline></video><div class="row"><a class="btn primary" href="${esc(url)}" download="itfmai-video-bg-removed-${Date.now()}.${esc(d.extension||'mp4')}">Download</a></div>`;
        else {result.innerHTML=`<img class="local-preview-img transparent-preview" src="${esc(url)}" alt="Background removed result"><div class="row"><a class="btn primary" href="${esc(url)}" download="itfmai-image-bg-removed-${Date.now()}.png">Download PNG</a><button class="btn" id="saveBgAsset">Save to Assets</button></div>`;document.querySelector('#saveBgAsset').onclick=()=>saveGeneratedData(url,'image/png','itfmai-image-bg-removed.png')}
        saveHistory(t[1],prompt||'Background removal','completed',{provider:d.provider||'configured',ratio}); toast('Background removed successfully');
      }
    }catch(err){result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>No fake output was generated. Try Free Local AI or check the provider configuration.</span></div>`;saveHistory(t[1],prompt||'Background removal','failed',{ratio});toast(err.message)}finally{btn.disabled=false}
  };
}

function studio(v,t){if(t[0]==='socially')return socially(v);if(t[0]==='chat')return chat(v);if(t[0]==='cover')return cover(v);if(t[0]==='genjutsu')return genjutsu(v);const key=t[0], isVideo=['video','avatar','animation'].includes(key), isAudio=['audio','music'].includes(key);let extra='';if(['image','video','avatar','character','animation','effects','tryon','design','genjutsu'].includes(key))extra+=`<div class="grid two"><div class="field"><label>Aspect Ratio</label><select name="ratio"><option>16:9</option><option>9:16</option><option>1:1</option></select></div><div class="field"><label>Quality</label><select name="quality"><option>High</option><option>Standard</option><option>Fast</option></select></div></div>`;if(['video','avatar','audio','music','animation'].includes(key))extra+=`<div class="grid two"><div class="field"><label>Language</label><select name="language"><option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Malayalam</option></select></div><div class="field"><label>Voice</label><select name="voice"><option>Male</option><option>Female</option></select></div></div>`;if(isVideo)extra+=`<div class="field"><label>Duration</label><select name="duration"><option>8 seconds</option><option>20 seconds</option><option>30 seconds</option><option>45 seconds</option><option>60 seconds</option></select></div>`;if(key==='audio')extra+=`<div class="field"><label>Audio Action</label><select name="audioAction"><option value="tts">Text → Speech</option><option value="stt">Speech → Text</option></select></div>`;if(key==='music')extra+=`<div class="field"><label>Lyrics</label><textarea name="lyrics" placeholder="Optional lyrics"></textarea></div>`;v.innerHTML=`<div class="section-head"><div><span class="eyebrow">WORKSPACE</span><h2>${esc(t[1])}</h2><p class="muted">${esc(t[2])}</p></div><span class="status-pill">LOCAL READY</span></div><div class="grid two studio-layout"><div class="card form-card">${providerNotice(t[1].replace(/^AI\s+/,'')).replace('AI AI','AI')}<form id="studioForm" class="form"><div class="field"><label>Prompt / Instructions</label><textarea name="prompt" required placeholder="Describe what you want to create or edit..."></textarea></div>${fileBox('studioFiles',t[3],true,'Upload reference / source files')}${extra}<div class="row"><button class="btn primary" type="submit">Generate with AI</button><button class="btn" type="button" id="previewBtn">Preview Input</button><button class="btn" type="button" id="saveDraft">Save Draft</button></div></form></div><div class="card result-card"><div class="result-head"><h3>Workspace Preview</h3><span>LOCAL PREVIEW</span></div><div class="preview" id="result"><div class="empty"><div class="big-icon"></div><b>Your input preview will appear here</b><p>Upload a file or save a prompt draft.</p></div></div></div></div>`;bindFiles('studioFiles',true);document.querySelector('#previewBtn').onclick=()=>document.querySelector('#result').innerHTML=localPreview(state.files);document.querySelector('#studioForm').onsubmit=async e=>{
e.preventDefault();
const form=e.currentTarget, prompt=form.querySelector('[name=prompt]').value.trim();
const audioAction=form.querySelector('[name=audioAction]')?.value;
if(!prompt && !(type==='audio' && audioAction==='stt')){toast('Enter a prompt first');return}
const type=key;
const result=document.querySelector('#result');
const btn=form.querySelector('button[type=submit]');
btn.disabled=true; result.innerHTML='<div class="notice"><b>Processing…</b><span>Waiting for the configured provider. No fake progress is shown.</span></div>';
saveHistory(t[1],prompt,'processing',{settings:Object.fromEntries([...form.querySelectorAll('select,textarea')].filter(x=>x.name).map(x=>[x.name,x.value]))});
try{
  let payload={type,prompt,ratio:form.querySelector('[name=ratio]')?.value||'16:9',duration:form.querySelector('[name=duration]')?.value||'',language:form.querySelector('[name=language]')?.value||'',voice:form.querySelector('[name=voice]')?.value||''};
  if(type==='music') payload.lyrics=form.querySelector('[name=lyrics]')?.value||'';
  const f=state.files?.[0];
  if(type==='audio' && form.querySelector('[name=audioAction]')?.value==='stt'){
    if(!f){throw new Error('Upload an audio file for Speech → Text.')}
    const fd=new FormData();fd.append('file',f,f.name);const r=await fetch('/api/transcribe',{method:'POST',body:fd});const data=await r.json();if(!r.ok)throw new Error(data.error||'Speech-to-Text failed.');result.innerHTML=`<div class="file-preview"><b>Transcription</b><p>${esc(data.text||'No speech was detected.')}</p><button class="btn small" id="copyTranscript" type="button">Copy text</button></div>`;document.querySelector('#copyTranscript').onclick=async()=>{try{await navigator.clipboard.writeText(data.text||'');toast('Transcription copied')}catch{toast('Copy failed')}};saveHistory(t[1],prompt||f.name,'completed',{provider:data.provider,mode:'stt'});toast('Transcription completed');btn.disabled=false;return}
  if(f && f.size<=12*1024*1024){
    if(f.type.startsWith('image/') && ['image','character','effects','tryon','design','video','avatar','animation','genjutsu'].includes(type)){payload.mimeType=f.type;payload.imageData=await fileToBase64(f)}
    if(f.type.startsWith('audio/') && ['music'].includes(type)){payload.audioMime=f.type;payload.audioData=await fileToBase64(f)}
  }
  const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await r.json(); if(!r.ok) throw new Error(data.error||'Generation failed.');
  if(data.kind==='image'){
    const src=`data:${data.mimeType};base64,${data.data}`;
    result.innerHTML=`<img class="local-preview-img" src="${src}" alt="Generated result"><div class="row"><a class="btn primary" href="${src}" download="itfmai-image-${Date.now()}.png">Download</a><button class="btn" id="saveGenerated">Save to Assets</button></div>`;
    document.querySelector('#saveGenerated').onclick=()=>saveGeneratedData(src,'image/png','itfmai-image.png');
    saveHistory(t[1],prompt,'completed',{provider:data.provider});
    toast('Image generated successfully');
  } else if(data.kind==='audio'){
    const src=data.data?`data:${data.mimeType||'audio/mpeg'};base64,${data.data}`:data.url;
    result.innerHTML=`<audio class="local-preview-audio" src="${src}" controls></audio><div class="row"><a class="btn primary" href="${src}" download="itfmai-audio-${Date.now()}.mp3">Download</a></div>`;
    saveHistory(t[1],prompt,'completed',{provider:data.provider});
    toast('Audio generated successfully');
  } else if(data.kind==='operation'){
    result.innerHTML='<div class="notice"><b>Queued / processing…</b><span>Checking the real provider status. No fake progress is shown.</span></div>';
    pollGeneration(data.provider,data.requestId||data.operation,result,t[1],prompt,0,data.model||'');
  } else if(['video','audio','image'].includes(data.kind) && data.url){
    renderMediaResult(result,data,t[1],prompt);
  }
}catch(err){
  result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>No fake output was generated.</span></div>`;
  saveHistory(t[1],prompt,'failed'); toast(err.message);
}finally{btn.disabled=false}
};
document.querySelector('#saveDraft').onclick=()=>{const prompt=document.querySelector('[name=prompt]').value.trim();if(!prompt){toast('Enter a prompt first');return}db.drafts.unshift({id:id(),type:t[1],prompt,created:Date.now()});saveHistory(t[1],prompt,'draft');save();toast('Draft saved locally')}}
function socially(v){
  const platforms=[
    ['youtube','YouTube'],['instagram','Instagram'],['facebook','Facebook'],
    ['tiktok','TikTok'],['x','X / Twitter'],['terabox','TeraBox'],
    ['pinterest','Pinterest'],['reddit','Reddit'],['vimeo','Vimeo'],
    ['twitch','Twitch'],['soundcloud','SoundCloud']
  ];
  v.innerHTML=`<div class="section-head"><div><span class="eyebrow">SOCIAL DOWNLOADER</span><h2>Social Media Tools</h2><p class="muted">Choose a platform, paste its public link, and download permitted media using the same clean workflow.</p></div><span class="status-pill">11 SERVICES</span></div>
  <div class="social-platforms" role="tablist" aria-label="Social media platforms">
    ${platforms.map((p,i)=>`<button class="social-platform ${i===0?'active':''}" type="button" role="tab" aria-selected="${i===0}" data-platform="${p[0]}"><span class="platform-mark">${p[1][0]}</span><span>${p[1]}</span></button>`).join('')}
  </div>
  <div class="grid two studio-layout socially-layout">
    <div class="card form-card">
      <div class="social-source-head"><div><span class="eyebrow">SELECTED PLATFORM</span><strong id="selectedPlatform">YouTube</strong></div><span class="source-dot">READY</span></div>
      <div class="notice"><b>Use only content you own or have permission to download.</b><span>This tool does not bypass private accounts, DRM, paywalls, or access controls.</span></div>
      <form id="socialForm" class="form">
        <div class="field"><label id="socialUrlLabel">YouTube link</label><input name="url" type="url" required inputmode="url" autocomplete="off" placeholder="Paste your YouTube link…"></div>
        <div class="grid two">
          <div class="field"><label>Download</label><select name="mode"><option value="auto">Video + Audio</option><option value="audio">Audio only (MP3)</option><option value="mute">Video only / muted</option></select></div>
          <div class="field"><label>Video quality</label><div class="quality-toggle" role="group" aria-label="Video quality"><button class="quality-choice" type="button" data-quality="480">SD <span>480p</span></button><button class="quality-choice active" type="button" data-quality="1080">HD <span>1080p</span></button><select name="quality" class="quality-select" aria-label="Advanced video quality"><option value="480">SD · 480p</option><option value="720">720p</option><option value="1080" selected>HD · 1080p</option><option value="1440">1440p</option><option value="2160">4K</option><option value="max">Best available</option></select></div></div>
        </div>
        <div class="field"><label>Language</label><div class="language-toggle" role="group" aria-label="Language"><button class="language-choice active" type="button" data-language="English">English</button><button class="language-choice" type="button" data-language="Hindi">Hindi</button><button class="language-choice" type="button" data-language="Tamil">Tamil</button><button class="language-choice" type="button" data-language="Telugu">Telugu</button><button class="language-choice" type="button" data-language="Malayalam">Malayalam</button></div><select name="language" class="language-select" aria-label="Language" hidden><option selected>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Malayalam</option></select></div>
        <div class="row"><button class="btn primary" type="submit">↓ Get Download</button><button class="btn" type="button" id="socialClear">Clear</button></div>
      </form>
      <div class="social-platform-note"><b id="platformNoteTitle">YouTube downloader</b><span id="platformNote">Paste a public YouTube URL to continue. The configured backend determines the available formats and real download link.</span></div>
    </div>
    <div class="card result-card"><div class="result-head"><h3>Download Result</h3><span>REAL LINK</span></div><div class="preview" id="socialResult"><div class="empty"><div class="big-icon">↓</div><b>Paste a YouTube link to begin</b><p>The configured downloader will return the real download link. No fake download is created.</p></div></div></div>
  </div>`;

  const form=document.querySelector('#socialForm'), result=document.querySelector('#socialResult');
  const qualitySelect=form.querySelector('[name=quality]'), languageSelect=form.querySelector('[name=language]');
  const platformData=Object.fromEntries(platforms.map(p=>[p[0],p[1]]));
  const notes={
    youtube:'Paste a public YouTube URL to continue. The configured backend determines the available formats and real download link.',
    instagram:'Paste a public Instagram URL to continue. Private content is not bypassed.',
    facebook:'Paste a public Facebook URL to continue. Private content and access controls are not bypassed.',
    tiktok:'Paste a public TikTok URL to continue. The configured backend determines availability.',
    x:'Paste a public X / Twitter URL to continue. The configured backend determines availability.',
    terabox:'Paste a TeraBox URL to continue. TeraBox support depends on the configured downloader backend.',
    pinterest:'Paste a public Pinterest URL to continue.',
    reddit:'Paste a public Reddit URL to continue.',
    vimeo:'Paste a public Vimeo URL to continue.',
    twitch:'Paste a public Twitch URL to continue.',
    soundcloud:'Paste a public SoundCloud URL to continue.'
  };
  let selectedPlatform='youtube';

  function setPlatform(key){
    selectedPlatform=key;
    const name=platformData[key];
    document.querySelectorAll('.social-platform').forEach(b=>{
      const active=b.dataset.platform===key;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',active);
    });
    document.querySelector('#selectedPlatform').textContent=name;
    document.querySelector('#socialUrlLabel').textContent=`${name} link`;
    form.querySelector('[name=url]').placeholder=`Paste your ${name} link…`;
    document.querySelector('#platformNoteTitle').textContent=`${name} downloader`;
    document.querySelector('#platformNote').textContent=notes[key];
    result.innerHTML=`<div class="empty"><div class="big-icon">↓</div><b>Paste a ${esc(name)} link to begin</b><p>The configured downloader will return the real download link. No fake download is created.</p></div>`;
    form.querySelector('[name=url]').focus();
  }

  document.querySelectorAll('.social-platform').forEach(b=>b.onclick=()=>setPlatform(b.dataset.platform));
  form.querySelectorAll('.language-choice').forEach(choice=>choice.onclick=()=>{
    languageSelect.value=choice.dataset.language;
    form.querySelectorAll('.language-choice').forEach(x=>x.classList.toggle('active',x===choice));
  });
  form.querySelectorAll('.quality-choice').forEach(choice=>choice.onclick=()=>{
    qualitySelect.value=choice.dataset.quality;
    form.querySelectorAll('.quality-choice').forEach(x=>x.classList.toggle('active',x===choice));
  });
  qualitySelect.onchange=()=>form.querySelectorAll('.quality-choice').forEach(x=>x.classList.toggle('active',x.dataset.quality===qualitySelect.value));
  document.querySelector('#socialClear').onclick=()=>{
    form.reset(); languageSelect.value='English'; qualitySelect.value='1080';
    form.querySelectorAll('.language-choice').forEach((x,i)=>x.classList.toggle('active',i===0));
    form.querySelectorAll('.quality-choice').forEach(x=>x.classList.toggle('active',x.dataset.quality==='1080'));
    setPlatform(selectedPlatform);
  };
  form.onsubmit=async e=>{
    e.preventDefault(); const url=form.querySelector('[name=url]').value.trim(); if(!url)return;
    let parsed; try{parsed=new URL(url)}catch{toast('Enter a valid social media link');return}
    if(!/^https?:$/.test(parsed.protocol)){toast('Only http/https links are supported');return}
    const btn=form.querySelector('button[type=submit]'); btn.disabled=true;
    result.innerHTML='<div class="notice"><b>Preparing download…</b><span>Contacting the configured downloader. No fake progress is shown.</span></div>';
    try{
      const r=await fetch('/api/social-download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,platform:selectedPlatform,mode:form.querySelector('[name=mode]').value,quality:form.querySelector('[name=quality]').value,language:form.querySelector('[name=language]').value})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||'Download service failed.');
      if(d.status==='picker' && Array.isArray(d.picker)){
        result.innerHTML=`<div class="social-picker"><h4>Select media</h4>${d.picker.map((item,i)=>`<div class="social-item">${item.thumb?`<img src="${esc(item.thumb)}" alt="">`:''}<div><b>${esc(item.title||`Media ${i+1}`)}</b><small>${esc(item.type||'video')}</small></div><a class="btn small primary" href="${esc(item.url)}" target="_blank" rel="noopener" download>Download</a></div>`).join('')}</div>`;
      } else if(d.url){
        const filename=String(d.filename||`social-${selectedPlatform}-${Date.now()}.mp4`).replace(/[^a-zA-Z0-9._-]+/g,'-');
        result.innerHTML=`<div class="social-download-result"><div class="big-icon">✓</div><b>${esc(d.filename||'Ready to download')}</b><p>${esc(d.service?`Source: ${d.service}`:'Download link ready')}</p><div class="row"><a class="btn primary" href="${esc(d.url)}" target="_blank" rel="noopener" download="${esc(filename)}">Download file</a><button class="btn" id="copySocial">Copy link</button></div></div>`;
        document.querySelector('#copySocial').onclick=async()=>{try{await navigator.clipboard.writeText(d.url);toast('Download link copied')}catch{toast('Copy failed')}};
      } else throw new Error('Downloader returned no downloadable media.');
      saveHistory(`Social Media Tools · ${platformData[selectedPlatform]}`,url,'completed',{service:d.service||'',platform:selectedPlatform,mode:form.querySelector('[name=mode]').value});
      toast(`${platformData[selectedPlatform]} download link ready`);
    }catch(err){result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>Configure a supported social downloader backend in Vercel environment variables. No fake output was generated.</span></div>`;saveHistory(`Social Media Tools · ${platformData[selectedPlatform]}`,url,'failed');toast(err.message)}finally{btn.disabled=false}
  };
}

function chat(v){v.innerHTML=`<div class="section-head"><div><h2>AI Chat</h2><p class="muted">Multimodal chat with real provider routing. Attach an image, PDF, document, audio or other supported file when your provider accepts it.</p></div><button class="btn" id="clearChat">New Conversation</button></div><div class="chat card"><div class="chat-messages" id="messages"><div class="chat-empty">Start a conversation.</div></div><div class="chat-attach">${fileBox('chatFiles','*/*',true,'Attach files')}</div><div class="chat-input"><textarea id="chatInput" placeholder="Ask anything..."></textarea><button class="btn" id="mic" type="button">Voice</button><button class="btn" id="speak" type="button">Speak</button><button class="btn primary" id="send" type="button">Send</button></div>${providerNotice('Chat')}</div>`;bindFiles('chatFiles',true);const messages=document.querySelector('#messages'),input=document.querySelector('#chatInput');let lastAssistant='';const append=(html)=>{messages.querySelector('.chat-empty')?.remove();messages.insertAdjacentHTML('beforeend',html);messages.scrollTop=messages.scrollHeight};const speak=(text)=>{if(!text){toast('No AI reply to speak yet.');return}if(!('speechSynthesis' in window)){toast('Voice playback is not supported in this browser.');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-IN';speechSynthesis.speak(u)};document.querySelector('#send').onclick=async()=>{const q=input.value.trim();if(!q)return;append(`<div class="bubble user">${esc(q)}</div><div class="notice" id="chatStatus"><b>Thinking…</b><span>Connecting to the configured AI provider.</span></div>`);saveHistory('AI Chat',q,'processing');input.value='';try{const attachment=state.files?.[0];const chatPayload={message:q};if(attachment&&attachment.size<=12*1024*1024){const encoded=await fileToBase64(attachment);if(attachment.type.startsWith('image/')){chatPayload.mimeType=attachment.type;chatPayload.imageData=encoded}else{chatPayload.fileMimeType=attachment.type;chatPayload.fileData=encoded;chatPayload.fileName=attachment.name}}const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(chatPayload)});const data=await r.json();document.querySelector('#chatStatus')?.remove();if(!r.ok)throw new Error(data.error||'AI Chat service unavailable.');lastAssistant=data.text||'';append(`<div class="bubble assistant"><b>AI · ${esc(data.provider||'provider')}</b><div>${esc(lastAssistant)}</div><button class="btn small speak-reply" type="button">Speak</button></div>`);messages.querySelector('.speak-reply:last-of-type')?.addEventListener('click',()=>speak(lastAssistant));saveHistory('AI Chat',q,'completed',{provider:data.provider});toast('AI reply received')}catch(e){document.querySelector('#chatStatus')?.remove();append(`<div class="notice"><b>${esc(e.message)}</b><span>No fake reply was generated.</span></div>`);saveHistory('AI Chat',q,'failed');toast(e.message)}};document.querySelector('#speak').onclick=()=>speak(lastAssistant);document.querySelector('#mic').onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('Voice input is not supported in this browser.');return}const r=new SR();r.lang='en-IN';r.interimResults=false;r.onresult=e=>{input.value+=(input.value?' ':'')+e.results[0][0].transcript};r.onerror=()=>toast('Microphone/voice input could not be started.');r.start()};document.querySelector('#clearChat').onclick=()=>{speechSynthesis?.cancel?.();messages.innerHTML='<div class="chat-empty">New conversation started.</div>';lastAssistant='';state.files=[];toast('New conversation started')}}

function cover(v){v.innerHTML=`<div class="section-head"><div><h2>AI Cover / Karaoke</h2><p class="muted">Generate a real singing cover from a reference track using external AI service music models.</p></div></div><div class="grid two studio-layout"><div class="card form-card">${providerNotice('Cover')}<form id="coverForm" class="form">${fileBox('karaoke','audio/*',false,'Upload karaoke / reference audio')}<div class="field"><label>Lyrics</label><textarea name="lyrics" placeholder="Paste lyrics here... (optional if the model can extract them)"></textarea></div><div class="field"><label>Cover Style</label><textarea name="prompt" placeholder="Emotional Malayalam female vocal, cinematic, soft orchestral backing..."></textarea></div><div class="grid two"><div class="field"><label>Language</label><select name="language"><option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Malayalam</option></select></div><div class="field"><label>Vocal Gender</label><select name="gender"><option>Male</option><option>Female</option></select></div></div><div class="row"><button class="btn primary" type="submit">Generate Cover</button><button class="btn" type="button" id="coverPreview">Preview Audio</button></div></form></div><div class="card result-card"><h3>Cover Preview</h3><div class="preview" id="coverResult"><div class="empty">No audio selected.</div></div></div></div>`;bindFiles('karaoke',false);document.querySelector('#coverPreview').onclick=()=>document.querySelector('#coverResult').innerHTML=localPreview(state.files);document.querySelector('#coverForm').onsubmit=async e=>{e.preventDefault();const file=state.files?.[0],f=e.currentTarget,result=document.querySelector('#coverResult'),btn=f.querySelector('button[type=submit]');if(!file){toast('Upload reference audio first');return}btn.disabled=true;result.innerHTML='<div class="notice"><b>Queueing cover…</b><span>Sending the real audio to external AI service. No fake progress is shown.</span></div>';const lyrics=f.querySelector('[name=lyrics]').value.trim();const prompt=(f.querySelector('[name=prompt]').value.trim()||`AI vocal cover, ${f.querySelector('[name=language]').value}, ${f.querySelector('[name=gender]').value} vocal`);saveHistory('AI Cover / Karaoke',lyrics||prompt,'processing',{provider:'external'});try{const fd=new FormData();fd.append('audio',file,file.name);fd.append('lyrics',lyrics);fd.append('prompt',prompt);const r=await fetch('/api/cover',{method:'POST',body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error||'Cover generation failed.');if(d.kind==='operation'){pollGeneration('external',d.requestId,result,'AI Cover / Karaoke',lyrics||prompt,0,d.model||'')}else if(d.url){renderMediaResult(result,d,'AI Cover / Karaoke',lyrics||prompt)}else throw new Error('Cover provider returned no media job or result.')}catch(err){result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>No fake cover was generated.</span></div>`;saveHistory('AI Cover / Karaoke',lyrics||prompt,'failed',{provider:'external'});toast(err.message)}finally{btn.disabled=false}}}

function genjutsu(v){v.innerHTML=`<div class="section-head"><div><span class="eyebrow">ADVANCED CREATIVE</span><h2>Genjutsu AI</h2><p class="muted">Create image or video concepts using motion references, characters, products, clothes and detailed generation settings.</p></div></div><div class="grid two studio-layout"><div class="card form-card">${providerNotice('Genjutsu')}<form id="genForm" class="form"><div class="field"><label>Reference Video</label><div class="upload" data-drop="genVideo"><div class="upload-icon">▶</div><b>Add a reference video to extract motion</b><span>Video duration: 4–60 seconds • MP4, MOV, WEBM</span><input id="genVideo" type="file" accept="video/mp4,video/quicktime,video/webm"><div class="file-list" id="genVideo-list"></div></div></div><div class="field"><label>Select from presets</label><select name="preset"><option>None</option><option>Cinematic Motion</option><option>Dance Motion</option><option>Product Showcase</option><option>Fashion Motion</option><option>Character Action</option></select></div><div class="field"><label>Characters, Products, or Clothes</label><div class="upload" data-drop="genRefs"><div class="upload-icon">＋</div><b>Add your characters, products, or clothes</b><span>Up to 60 images • JPG, PNG, WEBP</span><input id="genRefs" type="file" accept="image/jpeg,image/png,image/webp" multiple><div class="file-list" id="genRefs-list"></div></div></div><div class="field"><label>Prompt</label><textarea name="prompt" required placeholder="Describe the scene, motion, camera, subject and visual style..."></textarea></div><div class="field"><label>Negative Prompt</label><textarea name="negative" placeholder="Things to avoid..."></textarea></div><div class="card settings-card"><div class="section-head compact"><div><h3>Generation Settings</h3><p class="muted">Choose the output format and voice settings.</p></div></div><div class="grid two"><div class="field"><label>Aspect Ratio</label><select name="ratio"><option>16:9</option><option>9:16</option><option>1:1</option></select></div><div class="field"><label>Quality</label><select name="quality"><option>High</option><option>Standard</option><option>Fast</option></select></div></div><div class="grid two"><div class="field"><label>Language</label><select name="language"><option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Malayalam</option></select></div><div class="field"><label>Voice</label><select name="voice"><option>Male</option><option>Female</option></select></div></div><div class="grid two"><div class="field"><label>Duration</label><select name="duration"><option value="8">8 seconds</option><option value="20">20 seconds</option><option value="30">30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option></select></div><div class="field"><label>Output</label><select name="output"><option>Video</option><option>Image</option></select></div></div></div><div class="row"><button class="btn primary" type="submit">Generate</button><button class="btn" type="button" id="genPreview">Preview</button></div></form></div><div class="card result-card"><h3>Generation Preview</h3><div class="preview" id="genResult"><div class="empty">Add a reference video or images to preview them here.</div></div></div></div>`;let refs=[];const videoInput=document.querySelector('#genVideo'),videoBox=document.querySelector('[data-drop="genVideo"]'),refInput=document.querySelector('#genRefs'),refBox=document.querySelector('[data-drop="genRefs"]');function renderList(inputId,files){const el=document.querySelector('#'+inputId+'-list');if(!el)return;el.innerHTML=files.map((f,i)=>`<div class="file-row"><span>${icon(f.type)}</span><b>${esc(f.name)}</b><small>${fmt(f.size)}</small><button type="button" data-rm="${i}">×</button></div>`).join('');el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{files.splice(+b.dataset.rm,1);renderList(inputId,files)})}function addVideo(files){const f=files[0];if(!f)return;state.files=[f];renderList('genVideo',[f]);if(f.type.startsWith('video/')){const u=URL.createObjectURL(f);const el=document.createElement('video');el.preload='metadata';el.src=u;el.onloadedmetadata=()=>{if(el.duration<4||el.duration>60){toast('Reference video must be between 4 and 60 seconds.');state.files=[];renderList('genVideo',[])}else toast('Reference video added.')}}}videoInput.onchange=()=>addVideo([...videoInput.files]);videoBox.ondragover=e=>{e.preventDefault();videoBox.classList.add('drag')};videoBox.ondragleave=()=>videoBox.classList.remove('drag');videoBox.ondrop=e=>{e.preventDefault();videoBox.classList.remove('drag');addVideo([...e.dataTransfer.files])};function addRefs(files){refs=[...refs,...files].slice(0,60);renderList('genRefs',refs);if(files.length>60||refs.length===60)toast('Up to 60 reference images can be added.')}refInput.onchange=()=>addRefs([...refInput.files]);refBox.ondragover=e=>{e.preventDefault();refBox.classList.add('drag')};refBox.ondragleave=()=>refBox.classList.remove('drag');refBox.ondrop=e=>{e.preventDefault();refBox.classList.remove('drag');addRefs([...e.dataTransfer.files])};document.querySelector('#genPreview').onclick=()=>{const all=[...state.files,...refs];document.querySelector('#genResult').innerHTML=all.length?localPreview(all):'<div class="empty">No reference media selected.</div>'};document.querySelector('#genForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget, result=document.querySelector('#genResult'), btn=f.querySelector('button[type=submit]');const prompt=f.querySelector('[name=prompt]').value.trim();const output=f.querySelector('[name=output]').value;btn.disabled=true;result.innerHTML='<div class="notice"><b>Processing…</b><span>Connecting to the configured provider.</span></div>';saveHistory('Genjutsu AI',prompt,'processing');try{const payload={type:output==='Image'?'image':'video',prompt,ratio:f.querySelector('[name=ratio]').value,duration:f.querySelector('[name=duration]').value,negative:f.querySelector('[name=negative]').value};const ref=state.files?.[0];if(ref&&ref.size<=20*1024*1024){if(ref.type.startsWith('image/')){payload.mimeType=ref.type;payload.imageData=await fileToBase64(ref)}if(ref.type.startsWith('video/')){payload.videoMime=ref.type;payload.videoData=await fileToBase64(ref)}}const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Generation failed.');if(d.kind==='image'){const src=`data:${d.mimeType||'image/png'};base64,${d.data}`;result.innerHTML=`<img class="local-preview-img" src="${src}" alt="Generated result"><div class="row"><a class="btn primary" href="${src}" download="itfmai-genjutsu-image.png">Download</a></div>`;saveHistory('Genjutsu AI',prompt,'completed',{provider:d.provider});toast('Genjutsu image generated successfully')}else if(d.kind==='operation'){result.innerHTML='<div class="notice"><b>Video queued / processing…</b><span>Checking the real provider status.</span></div>';pollGeneration(d.provider,d.requestId||d.operation,result,'Genjutsu AI',prompt,0,d.model||'')}else if(d.kind==='video'&&d.url){renderVideoResult(result,d.url,'Genjutsu AI',prompt)}}catch(err){result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>No fake output was generated.</span></div>`;saveHistory('Genjutsu AI',prompt,'failed');toast(err.message)}finally{btn.disabled=false}}}
function karaokeRemover(v){
v.innerHTML=`<div class="section-head"><div><h2>Karaoke Remover</h2><p class="muted">Create an instrumental track by removing vocals from a song.</p></div><span class="tool-badge">VOCAL SEPARATION</span></div><div class="grid two studio-layout"><div class="card form-card"><form id="karaokeRemoveForm" class="form">${fileBox('karaokeRemoveAudio','audio/*',false,'Upload a song to remove vocals')}<div class="field"><label>Processing Instructions</label><textarea name="instructions" placeholder="Optional: keep music natural, preserve drums and bass..."></textarea></div><div class="grid two"><div class="field"><label>Output</label><select name="output"><option value="instrumental">Instrumental / Karaoke</option><option value="vocals">Vocals only</option></select></div><div class="field"><label>Quality</label><select name="quality"><option>High</option><option>Standard</option></select></div></div><button class="btn primary" type="submit">Remove Vocals</button></form></div><div class="card result-card"><div class="result-head"><h3>Instrumental Preview</h3><span class="status-pill" id="karaokeRemoveStatus">READY</span></div><div class="preview" id="karaokeRemoveResult"><div class="empty">Upload a song to begin.</div></div></div></div>`;
bindFiles('karaokeRemoveAudio',false);
document.querySelector('#karaokeRemoveForm').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,file=state.files[0],result=document.querySelector('#karaokeRemoveResult'),status=document.querySelector('#karaokeRemoveStatus'),btn=f.querySelector('button[type=submit]');if(!file){toast('Upload an audio file first');return}btn.disabled=true;status.textContent='PROCESSING';result.innerHTML='<div class="notice"><b>Processing audio…</b><span>Connecting to the configured vocal-separation service.</span></div>';saveHistory('Karaoke Remover',f.name,'processing',{instructions:f.instructions?.value||''});try{const fd=new FormData();fd.append('file',file);fd.append('instructions',f.instructions.value);fd.append('output',f.output.value);fd.append('quality',f.quality.value);const r=await fetch('/api/karaoke-remove',{method:'POST',body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error||'Karaoke removal failed.');if(d.url){result.innerHTML=`<audio class="local-preview-audio" src="${esc(d.url)}" controls></audio><div class="row"><a class="btn primary" href="${esc(d.url)}" download="itfmai-karaoke-removed.mp3">Download</a></div>`;status.textContent='COMPLETED';saveHistory('Karaoke Remover',f.name,'completed',{url:d.url})}else throw new Error('No output was returned by the configured service.')}catch(err){status.textContent='FAILED';result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>No fake audio output was created.</span></div>`;saveHistory('Karaoke Remover',f.name,'failed');toast(err.message)}finally{btn.disabled=false}}}
async function exportSilentVideoLocally(file,result){
  if(!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('Local video export is not supported in this browser. Try Chrome or Edge.');
  result.innerHTML='<div class="notice"><b>Removing audio on this device…</b><span>The original video stays in your browser. This creates a real silent WebM export.</span></div>';
  const src=URL.createObjectURL(file), video=document.createElement('video');
  video.src=src; video.muted=true; video.playsInline=true; video.preload='auto';
  await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('Could not read the selected video.'));});
  const scale=Math.min(1,1280/(video.videoWidth||1280));
  const canvas=document.createElement('canvas'); canvas.width=Math.max(2,Math.round((video.videoWidth||1280)*scale)); canvas.height=Math.max(2,Math.round((video.videoHeight||720)*scale));
  const ctx=canvas.getContext('2d'); const stream=canvas.captureStream(30);
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime) throw new Error('This browser cannot export WebM video.');
  const chunks=[], rec=new MediaRecorder(stream,{mimeType:mime});
  const done=new Promise((resolve,reject)=>{rec.onstop=resolve;rec.onerror=()=>reject(new Error('Video export failed.'));});
  result.innerHTML='<div class="notice"><b>Encoding silent video…</b><span>Progress: <strong id="silentVideoProgress">0%</strong></span></div>';
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  video.ontimeupdate=()=>{const p=result.querySelector('#silentVideoProgress');if(p&&video.duration)p.textContent=Math.round(video.currentTime/video.duration*100)+'%'};
  video.onended=()=>{try{rec.stop()}catch{}};
  rec.start(250); await video.play(); await done; stream.getTracks().forEach(t=>t.stop()); URL.revokeObjectURL(src);
  const blob=new Blob(chunks,{type:mime}); if(!blob.size) throw new Error('No silent video was produced.');
  const url=URL.createObjectURL(blob);
  result.innerHTML=`<video class="local-preview-media" src="${esc(url)}" controls playsinline></video><div class="row"><a class="btn primary" href="${esc(url)}" download="itfmai-silent-video-${Date.now()}.webm">Download Silent Video</a><button class="btn" id="saveSilentVideo">Save to Assets</button></div><div class="notice"><b>Free local export complete</b><span>Output format: WebM. No audio track is included.</span></div>`;
  document.querySelector('#saveSilentVideo').onclick=()=>saveGeneratedData(url,'video/webm','itfmai-silent-video.webm');
}

function encodeWavFromStereo(left,right,sampleRate){
  const n=left.length, out=new ArrayBuffer(44+n*2), view=new DataView(out);
  const put=(o,str)=>{for(let i=0;i<str.length;i++)view.setUint8(o+i,str.charCodeAt(i))};
  put(0,'RIFF'); view.setUint32(4,36+n*2,true); put(8,'WAVE'); put(12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true); put(36,'data'); view.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const v=Math.max(-1,Math.min(1,(left[i]-right[i])));view.setInt16(44+i*2,Math.round(v*32767),true)}
  return new Blob([out],{type:'audio/wav'});
}

async function reduceVocalsLocally(file,result){
  if(!window.AudioContext && !window.webkitAudioContext) throw new Error('Web Audio is not supported in this browser.');
  result.innerHTML='<div class="notice"><b>Reducing centered vocals on this device…</b><span>Your audio stays in the browser. The result will be a WAV file.</span></div>';
  const AC=window.AudioContext||window.webkitAudioContext, ctx=new AC();
  const buf=await ctx.decodeAudioData(await file.arrayBuffer());
  if(buf.numberOfChannels<2) throw new Error('Karaoke local mode needs a stereo audio file. Use a stereo MP3/WAV/M4A file.');
  const n=buf.length, left=buf.getChannelData(0), right=buf.getChannelData(1), outL=new Float32Array(n), outR=new Float32Array(n);
  for(let i=0;i<n;i++){const diff=left[i]-right[i];outL[i]=diff;outR[i]=diff}
  const blob=encodeWavFromStereo(outL,outR,buf.sampleRate), url=URL.createObjectURL(blob); await ctx.close();
  result.innerHTML=`<audio class="local-preview-audio" src="${esc(url)}" controls></audio><div class="row"><a class="btn primary" href="${esc(url)}" download="itfmai-karaoke-local-${Date.now()}.wav">Download WAV</a><button class="btn" id="saveKaraokeLocal">Save to Assets</button></div><div class="notice"><b>Free local vocal reduction complete</b><span>This uses center-channel cancellation. Some centered instruments may also be reduced; it is not AI stem separation.</span></div>`;
  document.querySelector('#saveKaraokeLocal').onclick=()=>saveGeneratedData(url,'audio/wav','itfmai-karaoke-local.wav');
}

function audioRemover(v){
v.innerHTML=`<div class="section-head"><div><h2>Audio Remover</h2><p class="muted">Remove the audio track locally in your browser and export a real silent video.</p></div><span class="tool-badge">FREE LOCAL</span></div><div class="grid two studio-layout"><div class="card form-card"><form id="audioRemoveForm" class="form">${fileBox('audioRemoveVideo','video/*',false,'Upload a video to remove its audio')}<div class="notice"><b>No API key required</b><span>The browser re-encodes the video without adding an audio track. Best in Chrome/Edge.</span></div><div class="row"><button class="btn primary" type="submit">Remove Audio</button><button class="btn" type="button" id="audioRemovePreview">Preview Input</button></div></form></div><div class="card result-card"><div class="result-head"><h3>Silent Video Preview</h3><span class="status-pill" id="audioRemoveStatus">READY</span></div><div class="preview" id="audioRemoveResult"><div class="empty">Upload a video to begin.</div></div></div></div>`;
bindFiles('audioRemoveVideo',false);
document.querySelector('#audioRemovePreview').onclick=()=>{const f=state.files[0];document.querySelector('#audioRemoveResult').innerHTML=f?localPreview([f]):'<div class="empty">Upload a video first.</div>'};
document.querySelector('#audioRemoveForm').onsubmit=async e=>{e.preventDefault();const file=state.files[0],result=document.querySelector('#audioRemoveResult'),status=document.querySelector('#audioRemoveStatus'),btn=e.currentTarget.querySelector('button[type=submit]');if(!file){toast('Upload a video file first');return}btn.disabled=true;status.textContent='PROCESSING';saveHistory('Audio Remover',file.name,'processing',{mode:'local'});try{await exportSilentVideoLocally(file,result);status.textContent='COMPLETED';saveHistory('Audio Remover',file.name,'completed',{mode:'local'})}catch(err){status.textContent='FAILED';result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>No fake video output was created.</span></div>`;saveHistory('Audio Remover',file.name,'failed',{mode:'local'});toast(err.message)}finally{btn.disabled=false}}}

function karaokeRemover(v){
v.innerHTML=`<div class="section-head"><div><h2>Karaoke Remover</h2><p class="muted">Free local vocal reduction for stereo tracks.</p></div><span class="tool-badge">FREE LOCAL</span></div><div class="grid two studio-layout"><div class="card form-card"><form id="karaokeRemoveForm" class="form">${fileBox('karaokeRemoveAudio','audio/*',false,'Upload a stereo song')}<div class="notice"><b>No API key required</b><span>Local mode uses center-channel cancellation and exports WAV. For true AI stem separation, configure an optional provider later.</span></div><div class="row"><button class="btn primary" type="submit">Remove Vocals</button><button class="btn" type="button" id="karaokePreview">Preview Input</button></div></form></div><div class="card result-card"><div class="result-head"><h3>Instrumental Preview</h3><span class="status-pill" id="karaokeRemoveStatus">READY</span></div><div class="preview" id="karaokeRemoveResult"><div class="empty">Upload a stereo song to begin.</div></div></div></div>`;
bindFiles('karaokeRemoveAudio',false);
document.querySelector('#karaokePreview').onclick=()=>{const f=state.files[0];document.querySelector('#karaokeRemoveResult').innerHTML=f?localPreview([f]):'<div class="empty">Upload a song first.</div>'};
document.querySelector('#karaokeRemoveForm').onsubmit=async e=>{e.preventDefault();const file=state.files[0],result=document.querySelector('#karaokeRemoveResult'),status=document.querySelector('#karaokeRemoveStatus'),btn=e.currentTarget.querySelector('button[type=submit]');if(!file){toast('Upload an audio file first');return}btn.disabled=true;status.textContent='PROCESSING';saveHistory('Karaoke Remover',file.name,'processing',{mode:'local-center-cancel'});try{await reduceVocalsLocally(file,result);status.textContent='COMPLETED';saveHistory('Karaoke Remover',file.name,'completed',{mode:'local-center-cancel'})}catch(err){status.textContent='FAILED';result.innerHTML=`<div class="notice"><b>${esc(err.message)}</b><span>No fake audio output was created.</span></div>`;saveHistory('Karaoke Remover',file.name,'failed',{mode:'local-center-cancel'});toast(err.message)}finally{btn.disabled=false}}}

function projects(v){v.innerHTML=`<div class="section-head"><div><h2>Projects</h2><p class="muted">Create, rename, duplicate and delete local projects.</p></div><button class="btn primary" id="newProject">+ New Project</button></div><div class="grid">${db.projects.length?db.projects.map(p=>`<div class="card project-card"><div class="project-art"></div><div><h3>${esc(p.name)}</h3><small>${new Date(p.created).toLocaleString()}</small></div><div class="row"><button class="btn small" data-ren="${p.id}">Rename</button><button class="btn small" data-dup="${p.id}">Duplicate</button><button class="btn small danger" data-del="${p.id}">Delete</button></div></div>`).join(''):'<div class="card empty">No projects yet.<br><button class="btn small" id="emptyNew">Create your first project</button></div>'}</div>`;const create=()=>{const n=prompt('Project name');if(n&&n.trim()){db.projects.unshift({id:id(),name:n.trim(),created:Date.now(),assets:[]});save();projects(v);toast('Project created locally')}};document.querySelector('#newProject').onclick=create;document.querySelector('#emptyNew')?.addEventListener('click',create);v.querySelectorAll('[data-ren]').forEach(b=>b.onclick=()=>{const p=db.projects.find(x=>x.id===b.dataset.ren),n=prompt('New project name',p.name);if(n&&n.trim()){p.name=n.trim();save();projects(v);toast('Project renamed')}});v.querySelectorAll('[data-dup]').forEach(b=>b.onclick=()=>{const p=db.projects.find(x=>x.id===b.dataset.dup);db.projects.unshift({...p,id:id(),name:p.name+' Copy',created:Date.now()});save();projects(v);toast('Project duplicated')});v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('Delete this project?')){db.projects=db.projects.filter(x=>x.id!==b.dataset.del);save();projects(v);toast('Project deleted')}})}
function assets(v){v.innerHTML=`<div class="section-head"><div><h2>Asset Library</h2><p class="muted">Persistent browser asset storage with preview, open, download and delete.</p></div></div>${fileBox('assetFiles','*/*',true,'Upload assets')}<div class="asset-grid">${db.assets.length?db.assets.map(a=>`<div class="asset card"><div class="asset-thumb">${a.type?.startsWith('image/')?`<img src="${esc(a.url)}" alt="${esc(a.name)}">`:a.type?.startsWith('video/')?`<video src="${esc(a.url)}" controls playsinline></video>`:a.type?.startsWith('audio/')?`<audio src="${esc(a.url)}" controls></audio>`:`<span class="big-icon">${icon(a.type)}</span>`}</div><div class="asset-body"><b>${esc(a.name)}</b><small>${esc(a.type||'file')} • ${fmt(a.size)}</small><div class="row"><a class="btn small" href="${esc(a.url)}" target="_blank" rel="noopener">Open</a><a class="btn small" href="${esc(a.url)}" download="${esc(a.name)}">Download</a><button class="btn small danger" data-del="${a.id}">Delete</button></div></div></div>`).join(''):'<div class="card empty">Your saved assets will appear here.</div>'}</div>`;bindFiles('assetFiles',true,files=>{files.forEach(f=>addAsset(f));toast(`${files.length} asset(s) saved locally`);setTimeout(()=>route('assets'),150)});v.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this asset?')){await deleteAssetBlob(b.dataset.del);db.assets=db.assets.filter(a=>a.id!==b.dataset.del);save();assets(v);toast('Asset deleted')}})}
function history(v){v.innerHTML=`<div class="section-head"><div><h2>Generation History</h2><p class="muted">Every local draft/request is recorded. Completed AI output is never faked.</p></div><button class="btn danger" id="clearHistory">Clear History</button></div><div class="grid">${db.history.length?db.history.map(h=>`<div class="card history-row"><div><b>${esc(h.type)}</b><small>${new Date(h.created).toLocaleString()}</small></div><span class="status-pill">${esc(h.status)}</span><p>${esc(h.prompt||'')}</p></div>`).join(''):'<div class="card empty">No generations yet.</div>'}</div>`;document.querySelector('#clearHistory').onclick=()=>{if(confirm('Clear Generation History?')){db.history=[];save();history(v);toast('History cleared')}}}
function closeMenu(){document.querySelector('#side')?.classList.remove('open');document.querySelector('#overlay')?.classList.remove('show')}
function route(idv){state.page=idv;location.hash=idv;const v=document.querySelector('#view');if(!v)return;document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===idv));closeMenu();if(idv==='dashboard')dashboard(v);else if(idv==='projects')projects(v);else if(idv==='assets')assets(v);else if(idv==='history')history(v);else{const t=tools.find(x=>x[0]===idv);if(t){if(t[0]==='image-bg-remover'||t[0]==='video-bg-remover')backgroundRemover(v,t);else if(t[0]==='karaoke-remover')karaokeRemover(v);else if(t[0]==='audio-remover')audioRemover(v);else studio(v,t)}else dashboard(v)}}
function renderApp(){document.documentElement.dataset.theme=localStorage.getItem(THEME)||'dark';root.innerHTML=shell();bindTheme();document.querySelector('#hamb').onclick=()=>{document.querySelector('#side').classList.toggle('open');document.querySelector('#overlay').classList.toggle('show')};document.querySelector('#overlay').onclick=closeMenu;document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>route(b.dataset.nav));document.querySelector('#homeBrand').onclick=()=>route('dashboard');document.querySelector('#homeBrand').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();route('dashboard')}};document.querySelector('#mobileHome').onclick=()=>route('dashboard');route(state.page)}
window.addEventListener('hashchange',()=>{state.page=(location.hash||'#dashboard').slice(1);route(state.page)});renderApp();

})();

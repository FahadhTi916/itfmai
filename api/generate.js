const MODEL_ENV={image:'HF_IMAGE_MODEL',video:'HF_VIDEO_MODEL',audio:'HF_AUDIO_MODEL',music:'HF_MUSIC_MODEL',cover:'HF_COVER_MODEL',studio:'HF_GENJUTSU_MODEL'};
const TASK={image:'text-to-image',video:'text-to-video',audio:'text-to-speech',music:'text-to-audio',cover:'text-to-audio',studio:'text-to-video'};
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const tool=String(req.body?.tool||'');const env=MODEL_ENV[tool];if(!env)return res.status(400).json({error:'Unsupported generation tool'});
 const token=process.env.HF_TOKEN,model=process.env[env];if(!token)return res.status(503).json({error:'Add HF_TOKEN to your server environment.'});if(!model)return res.status(503).json({error:`Add ${env} with a compatible Hugging Face model ID.`});
 const prompt=String(req.body?.prompt||'').trim();if(!prompt)return res.status(400).json({error:'prompt is required'});if(prompt.length>8000)return res.status(413).json({error:'Prompt is too long (maximum 8000 characters).'});
 try{
  const endpoint=process.env.HF_INFERENCE_BASE_URL||'https://router.huggingface.co/hf-inference/models';
  const r=await fetch(`${endpoint.replace(/\/$/,'')}/${encodeURIComponent(model)}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/octet-stream, application/json'},body:JSON.stringify({inputs:prompt,parameters:{wait_for_model:true}})});
  const type=r.headers.get('content-type')||'application/octet-stream';
  if(!r.ok){let detail='Hugging Face inference request failed';try{const j=JSON.parse(await r.text());detail=j.error||j.message||detail}catch{}return res.status(r.status===503?503:502).json({error:`${detail}. Check the model ID, task support, token permissions, and provider availability.`})}
  if(type.includes('application/json')){const data=await r.json();if(Array.isArray(data)&&data[0]?.generated_text)return res.status(200).json({text:data[0].generated_text,task:TASK[tool]});if(data?.generated_text)return res.status(200).json({text:data.generated_text,task:TASK[tool]});return res.status(502).json({error:'Model returned JSON instead of media. This model may require a task-specific adapter.'})}
  const bytes=Buffer.from(await r.arrayBuffer());if(!bytes.length)return res.status(502).json({error:'Model returned an empty result.'});if(bytes.length>8*1024*1024)return res.status(413).json({error:'Generated output exceeds the 8 MB inline response limit. Configure object storage for large outputs.'});
  let mimeType=type.split(';')[0];if(mimeType==='application/octet-stream')mimeType=tool==='image'?'image/png':(['audio','music','cover'].includes(tool)?'audio/wav':'video/mp4');
  return res.status(200).json({data:bytes.toString('base64'),mimeType,task:TASK[tool]});
 }catch(e){return res.status(502).json({error:'Could not reach Hugging Face inference. Verify the endpoint, model availability, and deployment runtime.'})}
}

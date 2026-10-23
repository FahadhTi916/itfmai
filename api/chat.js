export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.GROQ_API_KEY)return res.status(503).json({error:'Groq is not configured. Add GROQ_API_KEY in Vercel Environment Variables.'});
 try{
  const body=req.body||{};const messages=Array.isArray(body.messages)?body.messages:[];
  if(!messages.length)return res.status(400).json({error:'messages array required'});
  const safe=messages.slice(-30).filter(m=>['user','assistant','system'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,12000)}));
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.GROQ_MODEL||'llama-3.3-70b-versatile',messages:safe,temperature:0.7,max_tokens:2048})});
  const d=await r.json();if(!r.ok)return res.status(r.status).json({error:d.error?.message||'Groq request failed'});
  return res.status(200).json({reply:d.choices?.[0]?.message?.content||''});
 }catch(e){return res.status(500).json({error:'Chat request failed.'})}
}

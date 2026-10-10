export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed.'});
  const url=req.query?.url;
  if(!url) return res.status(400).json({error:'Missing media URL.'});
  try {
    const target = new URL(url);
    if(!/^https?:$/.test(target.protocol)) throw new Error('Unsupported media URL.');
    const upstream=await fetch(target.href);
    if(!upstream.ok) return res.status(upstream.status).end();
    const type=upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type',type);
    const buffer=Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buffer);
  } catch(error) {
    return res.status(502).json({error:error.message || 'Media fetch failed.'});
  }
}

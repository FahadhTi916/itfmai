const BASE='https://iptv-org.github.io/api';
export default async function handler(req,res){try{
 const id=String(req.query.id||'').slice(0,100),q=String(req.query.q||'').toLowerCase().slice(0,100),limit=Math.max(1,Math.min(100,Number(req.query.limit)||50));
 if(req.query.streams==='1'){
  if(!id)return res.status(400).json({error:'id required'});
  const [channelsR,streamsR]=await Promise.all([fetch(`${BASE}/channels.json`),fetch(`${BASE}/streams.json`)]);if(!channelsR.ok||!streamsR.ok)return res.status(502).json({error:'IPTV-org catalogue unavailable'});
  const [channels,streams]=await Promise.all([channelsR.json(),streamsR.json()]);const channel=channels.find(c=>c.id===id);const results=streams.filter(s=>s.channel===id&&s.url&&/^https?:\/\//i.test(s.url)).slice(0,10).map(s=>({url:s.url,quality:s.quality||null,referrer:s.referrer||null}));res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=3600');return res.status(200).json({channel:channel?{id:channel.id,name:channel.name}:null,streams:results});
 }
 const r=await fetch(`${BASE}/channels.json`);if(!r.ok)return res.status(502).json({error:'Channel catalogue unavailable'});const all=await r.json();const results=all.filter(c=>c.name&&(!q||c.name.toLowerCase().includes(q))).slice(0,limit).map(c=>({id:c.id,name:c.name,country:c.country,categories:c.categories,languages:c.languages,website:c.website}));res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=7200');return res.status(200).json({results});
 }catch(e){return res.status(500).json({error:'Channel catalogue failed.'})}}

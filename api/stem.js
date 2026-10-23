export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 if(!process.env.STEMSPLIT_API_KEY)return res.status(503).json({error:'Add STEMSPLIT_API_KEY in Vercel Environment Variables.'});
 if(!process.env.STEMSPLIT_API_URL)return res.status(503).json({error:'Add STEMSPLIT_API_URL from your StemSplit API documentation.'});
 return res.status(501).json({error:'StemSplit endpoint is configured, but the account-specific upload and job schema has not been supplied. Processing is disabled rather than sending audio in an unsupported format.'});
}

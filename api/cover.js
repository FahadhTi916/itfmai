import { cover } from './_lib/ai.js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed.'});
  try {
    const result = await cover(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 500).json({error:error.message || 'Cover generation failed.'});
  }
}

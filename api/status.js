import { operationStatus } from './_lib/ai.js';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed.'});
  const id=req.query?.id || req.query?.operationId;
  if(!id) return res.status(400).json({error:'Missing operation id.'});
  try {
    return res.status(200).json(await operationStatus(id));
  } catch(error) {
    return res.status(error.status || 500).json({error:error.message || 'Status lookup failed.'});
  }
}

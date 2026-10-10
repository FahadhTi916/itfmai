import { configured, keys } from './_lib/ai.js';

export default function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed.'});
  return res.status(200).json({
    configured: configured(),
    primaryProvider: 'ITFM AI Gateway',
    keys
  });
}

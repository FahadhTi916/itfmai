import { method, json } from "./_lib.js";
const keys = ["GEMINI_API_KEY","TMDB_API_KEY","WHOISJSON_API_KEY","GETIMG_API_KEY","GETIMG_VIDEO_API_KEY","ELEVENLABS_API_KEY","MUSIC_API_KEY","ACEMUSIC_API_KEY","HIGGSFIELD_API_KEY","SAVERAPI_API_KEY","DLGRAM_API_KEY","SOCIALKIT_API_KEY","REVID_API_KEY","PLAYTERABOX_API_KEY","BACKGROUND_REMOVE_API_KEY","KARAOKE_REMOVE_API_KEY"];
export default function handler(req,res){ if(!method(req,res,["GET"]))return; const result={}; for(const key of keys) result[key]=Boolean(process.env[key]); return json(res,200,result); }

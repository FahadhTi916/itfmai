"""ITFM local no-key backend. Uses a local Ollama installation; no cloud API key."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from pathlib import Path
import json, os, urllib.request, urllib.error

ROOT = Path(__file__).resolve().parent
HOST = os.getenv('ITFM_HOST', '127.0.0.1')
PORT = int(os.getenv('ITFM_PORT', '8787'))
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://127.0.0.1:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'qwen2.5:3b')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def _json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code); self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(body))); self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Headers','Content-Type'); self.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS')
        self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self): self._json(200, {'ok': True})
    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/health':
            return self._json(200, {'ok': True, 'mode':'local', 'ai_provider_key_required':False, 'ollama_url':OLLAMA_URL, 'model':OLLAMA_MODEL})
        if path.startswith('/api/'):
            return self._json(404, {'error':'Unknown local API route'})
        if path == '/': self.path = '/index.html'
        return super().do_GET()
    def do_POST(self):
        path = urlparse(self.path).path
        try: data = json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))) or b'{}')
        except Exception: return self._json(400, {'error':'Invalid JSON request'})
        if path == '/api/chat':
            messages = data.get('messages') or []
            if not isinstance(messages, list) or not messages:
                return self._json(400, {'error':'Send a non-empty messages array.'})
            payload = json.dumps({'model': OLLAMA_MODEL, 'messages': messages, 'stream': False}).encode()
            req = urllib.request.Request(OLLAMA_URL.rstrip('/') + '/api/chat', data=payload, headers={'Content-Type':'application/json'})
            try:
                with urllib.request.urlopen(req, timeout=300) as r: result = json.loads(r.read())
                content = (result.get('message') or {}).get('content','')
                if not content: return self._json(502, {'error':'Local model returned an empty response.'})
                return self._json(200, {'choices':[{'message':{'role':'assistant','content':content}}], 'local':True, 'model':OLLAMA_MODEL})
            except urllib.error.HTTPError as e:
                detail = e.read().decode('utf-8','replace')[:500]
                return self._json(502, {'error':f'Ollama returned HTTP {e.code}: {detail}. Check that Ollama is running and model is installed.'})
            except Exception as e:
                return self._json(503, {'error':f'Cannot reach local Ollama at {OLLAMA_URL}. Install/start Ollama and run: ollama pull {OLLAMA_MODEL}. Details: {e}'})
        if path == '/api/generate':
            feature = str(data.get('feature','AI')).upper()
            return self._json(501, {'error':f'{feature} local generation is not configured in this starter. It needs a compatible local model/runtime; no fake result was created.', 'local':True})
        if path == '/api/tmdb':
            return self._json(501, {'error':'TMDB search needs a TMDB API key. This local no-key mode does not call TMDB.'})
        return self._json(404, {'error':'Unknown local API route'})

if __name__ == '__main__':
    print(f'ITFM local server: http://{HOST}:{PORT}')
    print(f'Ollama: {OLLAMA_URL} | model: {OLLAMA_MODEL}')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()

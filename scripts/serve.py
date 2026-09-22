"""Serve bundled production assets on localhost without installing npm packages."""
import functools
import http.server
import pathlib
import socketserver
import webbrowser
ROOT=pathlib.Path(__file__).resolve().parents[1]/'frontend/dist'
if not (ROOT/'index.html').exists():
    raise SystemExit('Production build is missing. Run npm ci and npm run build in frontend first.')
class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.wasm':'application/wasm','.mjs':'text/javascript','.js':'text/javascript'}
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        super().end_headers()
handler=functools.partial(Handler,directory=str(ROOT))
socketserver.TCPServer.allow_reuse_address=True
try:
    with http.server.ThreadingHTTPServer(('127.0.0.1',8080),handler) as server:
        print('MathTech Face Tracking & Analysis — http://localhost:8080\nPress Ctrl+C to stop.')
        webbrowser.open('http://localhost:8080')
        server.serve_forever()
except KeyboardInterrupt: print('\nServer stopped.')
except OSError as e: raise SystemExit(f'Could not start on port 8080: {e}')

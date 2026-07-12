// Minimal zero-dep static + proxy server to serve the BUILT Vendorya PWA
// (dist/) with a real service worker, while proxying /api + /media to the dev
// Django backend on :8001. SPA routes fall back to index.html.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const DIST = '/home/ubuntu/vendorya-dev/vendorya-frontend/dist'
const API_TARGET = { host: 'localhost', port: 8001 }
const PORT = 4173

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
}

function proxy(req, res) {
  const opts = {
    host: API_TARGET.host, port: API_TARGET.port,
    method: req.method, path: req.url, headers: { ...req.headers, host: `localhost:${API_TARGET.port}` },
  }
  const up = http.request(opts, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res) })
  up.on('error', e => { res.writeHead(502); res.end('proxy error: ' + e.message) })
  req.pipe(up)
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (url.startsWith('/api') || url.startsWith('/media')) return proxy(req, res)

  let filePath = path.join(DIST, url)
  if (url === '/' || !path.extname(url)) filePath = path.join(DIST, 'index.html') // SPA fallback
  fs.readFile(filePath, (err, data) => {
    if (err) { // unknown asset → SPA fallback
      return fs.readFile(path.join(DIST, 'index.html'), (e2, d2) =>
        e2 ? (res.writeHead(404), res.end('not found')) : (res.writeHead(200, { 'Content-Type': 'text/html' }), res.end(d2)))
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' })
    res.end(data)
  })
}).listen(PORT, () => console.log(`PWA served on http://localhost:${PORT} (api→:8001)`))

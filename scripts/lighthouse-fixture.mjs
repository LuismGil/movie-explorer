import { execFileSync } from 'node:child_process';
import { createHash, X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { connect } from 'node:net';
import { join } from 'node:path';
import sharp from 'sharp';

const host = '127.0.0.1';
const catalogHost = 'api.themoviedb.org';
const posterHost = 'image.tmdb.org';
const allowed = new Set([catalogHost, posterHost].map(name => `${name}:443`));
const results = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  title: `Filme de referência ${index + 1}`,
  poster_path: `/fixture-${index + 1}.jpg`,
  release_date: '2024-06-01',
  vote_average: 7.5,
}));

async function posters() {
  const width = 500;
  const height = 750;
  const pixels = Buffer.alloc(width * height * 3);
  let seed = 121;
  for (let i = 0; i < pixels.length; i += 3) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const grain = seed >>> 27;
    pixels[i] = ((i / 3) % width) * 0.3 + grain;
    pixels[i + 1] = (i / (width * 3)) * 0.2 + grain;
    pixels[i + 2] = 48 + grain;
  }
  return new Map(await Promise.all([185, 342, 500].map(async size => [
    size, await sharp(pixels, { raw: { width, height, channels: 3 } }).resize(size).jpeg({ quality: 86 }).toBuffer(),
  ])));
}

function listen(server) {
  return new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, host, () => done(server.address().port));
  });
}

function trackConnections(server, sockets) {
  server.on('connection', socket => {
    sockets.add(socket);
    // Chrome can reset a connection before sending CONNECT or completing TLS.
    // There is no tunnel-level error handler yet at that point.
    socket.on('error', () => socket.destroy());
    socket.once('close', () => sockets.delete(socket));
  });
}

export async function startFixture(directory) {
  const keyPath = join(directory, 'fixture.key');
  const certificate = join(directory, 'fixture.crt');
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', `/CN=${catalogHost}`, '-addext', `subjectAltName=DNS:${catalogHost},DNS:${posterHost}`,
    '-keyout', keyPath, '-out', certificate,
  ], { stdio: 'ignore' });
  const cert = readFileSync(certificate);
  const fingerprint = createHash('sha256').update(new X509Certificate(cert).publicKey.export({
    type: 'spki', format: 'der',
  })).digest('base64');
  const images = await posters();
  const catalog = JSON.stringify({ page: 1, results, total_pages: 2, total_results: 40 });
  const https = createHttpsServer({ key: readFileSync(keyPath), cert }, (req, res) => {
    const path = (req.url ?? '').split('?')[0];
    if (req.method === 'GET' && req.headers.host === catalogHost && path === '/3/movie/popular') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(catalog);
      return;
    }
    const poster = /^\/t\/p\/w(185|342|500)\/fixture-([1-9]|1\d|20)\.jpg$/.exec(path);
    if (req.method === 'GET' && req.headers.host === posterHost && poster) {
      const image = images.get(Number(poster[1]));
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': image.length }).end(image);
      return;
    }
    res.writeHead(404).end();
  });
  const proxy = createServer((req, res) => res.writeHead(403).end());
  const sockets = new Set();
  trackConnections(https, sockets);
  trackConnections(proxy, sockets);
  const httpsPort = await listen(https);
  proxy.on('connect', (req, client, head) => {
    if (!allowed.has(req.url)) {
      client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    const fixture = connect(httpsPort, host, () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) fixture.write(head);
      client.pipe(fixture).pipe(client);
    });
    const close = () => { fixture.destroy(); client.destroy(); };
    fixture.on('error', close);
    client.on('error', close);
    client.on('close', close);
    fixture.on('close', close);
  });
  const stop = () => {
    for (const socket of sockets) socket.destroy();
    proxy.close();
    https.closeAllConnections();
    https.close();
  };
  try {
    const port = await listen(proxy);
    return { url: `http://${host}:${port}`, certificate, fingerprint, stop };
  } catch (error) {
    stop();
    throw error;
  }
}

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--') && i + 1 < argv.length) {
      args[key.slice(2)] = argv[++i];
    }
  }
  return args;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function writeStdoutChunk(buf) {
  return new Promise((resolve, reject) => {
    if (process.stdout.destroyed || process.stdout.writableEnded) {
      reject(new Error('stdout stream closed'));
      return;
    }
    const ok = process.stdout.write(buf, (err) => {
      if (err) reject(err);
    });
    if (ok) {
      resolve();
    } else {
      process.stdout.once('drain', resolve);
    }
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const jobPath = args.job;
  const browserPath = args.browser;
  const backdropsDir = args.backdrops || '';
  const htmlPath = args.html || path.join(__dirname, 'index.html');
  const bundlePath = args.bundle || path.join(__dirname, 'scene-3d.bundle.js');

  if (!jobPath || !browserPath) {
    console.error('Usage: node render-3d-frames.mjs --job <job.json> --browser <msedge|chrome>');
    process.exit(2);
  }

  const jobRaw = fs.readFileSync(jobPath);
  const job = JSON.parse(jobRaw.toString('utf8'));
  const width = job.width | 0;
  const height = job.height | 0;
  const rowBytes = width * 4;
  const expectedFrameBytes = rowBytes * height;
  const htmlBytes = fs.readFileSync(htmlPath);
  const bundleBytes = fs.readFileSync(bundlePath);
  const flipped = Buffer.allocUnsafe(expectedFrameBytes);

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'animstudio-3d-edge-'));
  let browserProc = null;
  let server = null;
  let finished = false;
  let framesWritten = 0;

  const cleanup = () => {
    try {
      if (browserProc && !browserProc.killed) {
        browserProc.kill('SIGKILL');
      }
    } catch { /* ignore */ }
    try {
      server?.close();
    } catch { /* ignore */ }
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  };

  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });
  process.stdout.on('error', () => {
    if (!finished) {
      cleanup();
      process.exit(1);
    }
  });

  // Inactivity watchdog so an internal browser stall never hangs forever
  let lastActivityMs = Date.now();
  const watchdog = setInterval(() => {
    if (Date.now() - lastActivityMs > 90_000) {
      console.error('WebGL 3D renderer stalled waiting for browser frame.');
      clearInterval(watchdog);
      cleanup();
      process.exit(1);
    }
  }, 5000);

  server = http.createServer(async (req, res) => {
    try {
      const urlPath = (req.url || '/').split('?')[0];
      if (req.method === 'GET' && urlPath === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlBytes);
        return;
      }
      if (req.method === 'GET' && urlPath === '/scene-3d.bundle.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(bundleBytes);
        return;
      }
      if (req.method === 'GET' && urlPath === '/job.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(jobRaw);
        return;
      }
      if (req.method === 'GET' && urlPath.startsWith('/backdrop/')) {
        const idx = Number.parseInt(urlPath.slice('/backdrop/'.length), 10);
        const file = Number.isFinite(idx) && backdropsDir ? path.join(backdropsDir, `${idx}.rgba`) : '';
        if (file && fs.existsSync(file)) {
          res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
          fs.createReadStream(file).pipe(res);
          return;
        }
        res.writeHead(404);
        res.end();
        return;
      }
      if (req.method === 'POST' && urlPath.startsWith('/frame/')) {
        const body = await readRequestBody(req);
        if (body.length !== expectedFrameBytes) {
          res.writeHead(400);
          res.end(`Expected ${expectedFrameBytes} bytes, got ${body.length}`);
          return;
        }
        // Flip WebGL bottom-up rows to FFmpeg top-down raw RGBA row order
        for (let y = 0; y < height; y++) {
          const srcOffset = (height - 1 - y) * rowBytes;
          body.copy(flipped, y * rowBytes, srcOffset, srcOffset + rowBytes);
        }
        await writeStdoutChunk(flipped);
        framesWritten++;
        lastActivityMs = Date.now();
        res.writeHead(204);
        res.end();
        return;
      }
      if (req.method === 'POST' && urlPath === '/done') {
        finished = true;
        clearInterval(watchdog);
        res.writeHead(204);
        res.end();
        process.stdout.end(() => {
          cleanup();
          process.exit(0);
        });
        return;
      }
      if (req.method === 'POST' && urlPath === '/error') {
        const msg = (await readRequestBody(req)).toString('utf8');
        clearInterval(watchdog);
        console.error('WebGL 3D scene error:', msg);
        res.writeHead(204);
        res.end();
        cleanup();
        process.exit(1);
        return;
      }
      res.writeHead(404);
      res.end();
    } catch (err) {
      clearInterval(watchdog);
      console.error('WebGL bridge server error:', err);
      cleanup();
      process.exit(1);
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;

  const browserArgs = [
    '--headless=new',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--autoplay-policy=no-user-gesture-required',
    `--user-data-dir=${profileDir}`,
    url,
  ];
  if (process.platform === 'linux') {
    browserArgs.push('--no-sandbox', '--disable-dev-shm-usage');
  }

  browserProc = spawn(browserPath, browserArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
  let browserStderr = '';
  browserProc.stderr?.on('data', (d) => {
    if (browserStderr.length < 4000) browserStderr += d.toString();
  });
  browserProc.on('exit', (code) => {
    if (!finished) {
      clearInterval(watchdog);
      console.error(`Headless browser exited unexpectedly (code=${code}, frames=${framesWritten}): ${browserStderr}`);
      cleanup();
      process.exit(1);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

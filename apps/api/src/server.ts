// MAGRABi Vendor Hub API. `createApp()` for tests; listens when run directly.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { config } from './config.js';
import { openDatabase, type DB } from './db/index.js';
import { createRequire } from 'node:module';
const pkg = createRequire(import.meta.url)('../package.json') as { version: string };
import { seedDemo } from './db/seed.js';
import { attachUser } from './auth/index.js';
import { authRoutes } from './routes/auth.js';
import { staffRoutes } from './routes/staff.js';
import { vendorRoutes } from './routes/vendor.js';
import { fileRoutes } from './routes/files.js';
import { HttpError } from './lib/errors.js';
import { log } from './lib/log.js';
import { startHousekeeping } from './jobs/reminders.js';
import { startRetention } from './jobs/retention.js';
import { housekeepingDeps } from './jobs/deps.js';
import { nowIso } from './lib/time.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * CSRF guard for state-changing API calls: when a browser sends an Origin header it must match the app's own origin
 * (PUBLIC_URL, the dev web server, or the request host). Requests without Origin (curl, server-to-server) pass.
 */
function originCheck(req: Request, _res: Response, next: NextFunction): void {
  if (!req.path.startsWith('/api') || !['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  const allowed = new Set([config.publicUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', `${req.protocol}://${req.get('host')}`]);
  if (allowed.has(origin.replace(/\/$/, ''))) return next();
  next(new HttpError(403, 'bad_origin', 'Request origin not allowed'));
}

export function createApp(db: DB = openDatabase()) {
  // demo mode: seed on first start so the team always has something to look at
  if (config.mode === 'demo') {
    const n = (db.prepare('SELECT COUNT(*) n FROM vendors').get() as { n: number }).n;
    if (n === 0) { seedDemo(db); log.info('Seeded demo data'); }
  }
  fs.mkdirSync(config.uploadsDir, { recursive: true });

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: [config.publicUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
  if (process.env.NODE_ENV !== 'test') app.use(pinoHttp({ logger: log, autoLogging: { ignore: (req) => { const u = req.url ?? ''; return u.startsWith('/assets') || u === '/api/health' || u.startsWith('/files/') || u.startsWith('/samples/') || /\.(js|css|png|jpg|svg|woff2?|ico|map)(\?|$)/.test(u); } } }));
  app.use(express.json({ limit: '1mb' }));
  app.use(originCheck);
  app.use(attachUser(db));
  const startedAt = Date.now();
  app.get('/api/health', (_req, res) => {
    let dbOk = 'ok';
    try { db.prepare('SELECT 1').get(); } catch { dbOk = 'error'; }
    res.status(dbOk === 'ok' ? 200 : 503).json({ ok: dbOk === 'ok', db: dbOk, mode: config.mode, version: pkg.version, time: nowIso(), uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) });
  });
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }), authRoutes(db));
  app.use('/api/v', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }), vendorRoutes(db));
  app.use('/api/staff', staffRoutes(db));
  app.use('/files', fileRoutes(db));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'not_found', 'Unknown API route')));

  // Production: serve the built web app
  const webDist = path.resolve(here, '../../web/dist');
  if (fs.existsSync(path.join(webDist, 'index.html'))) {
    app.use(express.static(webDist, { maxAge: '1h', index: false }));
    app.get(/^(?!\/api|\/files).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
    const anyErr = err as { type?: string; status?: number; message?: string };
    if (anyErr.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'bad_json', message: 'Malformed JSON body' } });
    log.error({ err }, 'unhandled error');
    res.status(500).json({ error: { code: 'internal', message: 'Something went wrong on our side' } });
  });
  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const db = openDatabase();
  const app = createApp(db);
  const deps = housekeepingDeps(db);
  startHousekeeping(db, deps.issueToken, deps.send);
  startRetention(db);
  app.listen(config.port, () => log.info({ port: config.port, mode: config.mode, publicUrl: config.publicUrl, db: config.dbPath }, 'Vendor Hub API listening'));
}

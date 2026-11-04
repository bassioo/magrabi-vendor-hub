// Per-request context so links and cookies can follow the address the user actually used (PUBLIC_URL=auto),
// which is what hosted previews and one-click deploys behind a proxy need.
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

interface Ctx { origin: string; secure: boolean }
const als = new AsyncLocalStorage<Ctx>();

export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  const proto = (req.get('x-forwarded-proto') ?? req.protocol).split(',')[0].trim();
  const origin = `${proto}://${req.get('host')}`;
  als.run({ origin, secure: proto === 'https' }, () => next());
}

/** Base URL for links: the request's own origin when PUBLIC_URL=auto, else the configured PUBLIC_URL. */
export function publicBase(): string {
  if (config.publicUrlAuto) return als.getStore()?.origin ?? config.publicUrl;
  return config.publicUrl;
}

/** Whether the current request arrived over https (behind a trusted proxy or directly). */
export function requestIsSecure(): boolean {
  return als.getStore()?.secure ?? config.publicUrl.startsWith('https');
}

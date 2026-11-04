// Daily retention: when settings.retentionDays > 0, files of rejected/expired vendors older than that are deleted from disk.
// The database rows stay (audit trail), with storage_key cleared and purged_at set.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { addAudit, getSettings, listRetentionCandidates, listStoredFiles, markDocumentPurged, type DB } from '../db/index.js';
import { nowIso } from '../lib/time.js';
import { log } from '../lib/log.js';

export function runRetention(db: DB): { purgedVendors: number; purgedFiles: number; retentionDays: number } {
  const days = getSettings(db).retentionDays;
  if (!days || days <= 0) return { purgedVendors: 0, purgedFiles: 0, retentionDays: 0 };
  let purgedVendors = 0, purgedFiles = 0;
  for (const v of listRetentionCandidates(db, days)) {
    const files = listStoredFiles(db, v.id);
    for (const f of files) {
      const abs = path.resolve(config.dataDir, f.storageKey);
      if (abs.startsWith(config.dataDir)) { try { fs.unlinkSync(abs); } catch { /* already gone */ } }
      markDocumentPurged(db, f.id, nowIso());
      purgedFiles += 1;
    }
    addAudit(db, v.id, 'System', 'system', 'Documents purged under retention policy', `${files.length} file${files.length === 1 ? '' : 's'} removed after ${days} days (${v.status})`);
    purgedVendors += 1;
  }
  return { purgedVendors, purgedFiles, retentionDays: days };
}

export function startRetention(db: DB): NodeJS.Timeout {
  const tick = () => { try { const r = runRetention(db); if (r.purgedVendors) log.info(r, 'retention'); } catch (err) { log.error({ err }, 'retention failed'); } };
  setTimeout(tick, 60_000);
  return setInterval(tick, 24 * 60 * 60 * 1000);
}

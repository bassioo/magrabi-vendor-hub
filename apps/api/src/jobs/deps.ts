// The two callbacks the housekeeping job needs, built once per process so the server and the admin "run now" route share them.
import { getSettings, getVendor, setInviteToken, type DB } from '../db/index.js';
import { encrypt } from '../lib/crypto.js';
import { sha256 } from '../lib/hash.js';
import { randomToken } from '../lib/ids.js';
import { addDays, nowIso } from '../lib/time.js';
import { sendEmail, templates } from '../services/email.js';

export function housekeepingDeps(db: DB) {
  return {
    issueToken: async (vendorId: string): Promise<string> => {
      const token = randomToken(32);
      setInviteToken(db, vendorId, sha256(token), encrypt(token), addDays(nowIso(), getSettings(db).inviteValidDays));
      return token;
    },
    send: async (vendorId: string, token: string): Promise<void> => {
      const v = getVendor(db, vendorId);
      if (v) await sendEmail(db, templates.reminder(v, token));
    },
  };
}

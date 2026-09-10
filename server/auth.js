// The admin is protected by a single password (ADMIN_PASSWORD). The admin page
// sends it as a bearer token with every request.
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';
const PASSWORD = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin');

if (!process.env.ADMIN_PASSWORD) {
  console.warn(
    isProd
      ? 'ADMIN_PASSWORD is not set — the admin is disabled until it is.'
      : 'ADMIN_PASSWORD is not set — using the development password "admin".',
  );
}

const hash = (s) => crypto.createHash('sha256').update(String(s)).digest();
const matches = (given) => Boolean(PASSWORD) && crypto.timingSafeEqual(hash(given), hash(PASSWORD));

function requireAdmin(req, res, next) {
  if (!PASSWORD) return res.status(503).json({ error: 'Admin is disabled: set ADMIN_PASSWORD on the server.' });
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!matches(token)) return res.status(401).json({ error: 'Wrong password.' });
  next();
}

async function login(req, res) {
  if (!PASSWORD) return res.status(503).json({ error: 'Admin is disabled: set ADMIN_PASSWORD on the server.' });
  if (matches(req.body?.password || '')) return res.json({ ok: true });
  // Slow down password guessing a little.
  await new Promise((r) => setTimeout(r, 800));
  res.status(401).json({ error: 'Wrong password.' });
}

module.exports = { requireAdmin, login };

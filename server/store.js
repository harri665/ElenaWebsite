// All site content lives in one JSON file (data/site.json). On first run it is
// copied from data/seed.json. Uploaded images/videos go in data/uploads/.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const SITE_FILE = path.join(DATA_DIR, 'site.json');
const SEED_FILE = path.join(__dirname, 'data', 'seed.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(SITE_FILE)) fs.copyFileSync(SEED_FILE, SITE_FILE);

let site = JSON.parse(fs.readFileSync(SITE_FILE, 'utf8'));
// Sites created before the blog existed have no posts list yet.
site.posts ??= [];
site.published ??= [];

// Writes are chained so two quick saves can't interleave, and go through a
// temp file + rename so a crash mid-write never leaves a half-written file.
let writing = Promise.resolve();
function save() {
  const snapshot = JSON.stringify(site, null, 2) + '\n';
  writing = writing.then(async () => {
    const tmp = SITE_FILE + '.tmp';
    await fs.promises.writeFile(tmp, snapshot);
    await fs.promises.rename(tmp, SITE_FILE);
  });
  return writing;
}

const getSite = () => site;

const newId = () => crypto.randomBytes(6).toString('base64url');

function slugify(title) {
  return (
    title
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'piece'
  );
}

// Slugs are unique within one list (pieces or posts).
function uniqueSlug(title, ignoreId, list = site.pieces) {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; list.some((p) => p.slug === slug && p.id !== ignoreId); n++) slug = `${base}-${n}`;
  return slug;
}

// Whether an image path is still referenced anywhere (a piece, the about photo, a post or published-work cover).
function isInUse(src) {
  return (
    site.pieces.some((p) => p.media.some((m) => m.src === src)) ||
    site.about.image === src ||
    site.posts.some((p) => p.cover === src) ||
    site.published.some((p) => p.cover === src)
  );
}

// Only files we uploaded are ever deleted — never the original /art images.
function deleteUpload(src) {
  if (typeof src !== 'string' || !src.startsWith('/uploads/')) return;
  const file = path.join(UPLOADS_DIR, path.basename(src));
  fs.promises.unlink(file).catch(() => {});
}

module.exports = { getSite, save, newId, uniqueSlug, isInUse, deleteUpload, UPLOADS_DIR };

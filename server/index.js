const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { getSite, save, newId, uniqueSlug, isInUse, deleteUpload, UPLOADS_DIR } = require('./store');
const { requireAdmin, login } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

// ───────────── uploads ─────────────

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: 80 * 1024 * 1024, files: 30 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) cb(null, true);
    else cb(new BadRequest(`"${file.originalname}" isn't a supported image or video (use JPG, PNG, WebP, GIF, MP4 or WebM).`));
  },
});

const toMedia = (file) => ({
  type: file.mimetype.startsWith('video/') ? 'video' : 'image',
  src: `/uploads/${file.filename}`,
});

// ───────────── validation ─────────────

class BadRequest extends Error {}

function text(value, { field, max, required = false }) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (required && !s) throw new BadRequest(`${field} is required.`);
  if (s.length > max) throw new BadRequest(`${field} must be ${max} characters or fewer.`);
  return s;
}

function url(value, field) {
  const s = text(value, { field, max: 500 });
  if (s && !/^https?:\/\/\S+$/i.test(s)) throw new BadRequest(`${field} must start with http:// or https://`);
  return s;
}

function parseJson(value, field) {
  try {
    return JSON.parse(value);
  } catch {
    throw new BadRequest(`${field} is malformed.`);
  }
}

function date(value) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) throw new BadRequest('Date must be a valid date.');
  return s;
}

// An image picked from the site (/art/… or /uploads/…), or '' for none.
function imagePath(value, field) {
  const s = typeof value === 'string' ? value : '';
  if (s && !/^\/(art|uploads)\/[\w.-]+$/.test(s)) throw new BadRequest(`${field} is malformed.`);
  return s;
}

function findIn(list, id, what) {
  const item = list.find((p) => p.id === id);
  if (!item) {
    const err = new BadRequest(`That ${what} no longer exists.`);
    err.status = 404;
    throw err;
  }
  return item;
}

// A cover chosen from the site's images, or a freshly uploaded one (which wins).
function readCover(req) {
  let cover = imagePath(req.body.cover, 'Cover image');
  if (req.file) {
    if (!req.file.mimetype.startsWith('image/')) throw new BadRequest('The cover must be an image.');
    cover = `/uploads/${req.file.filename}`;
  }
  return cover;
}

const findPost = (id) => findIn(getSite().posts, id, 'post');

function findPiece(id) {
  const piece = getSite().pieces.find((p) => p.id === id);
  if (!piece) {
    const err = new BadRequest('That piece no longer exists.');
    err.status = 404;
    throw err;
  }
  return piece;
}

// If a request fails after files were saved, don't leave them lying around.
const discardUploads = (req) => (req.files || (req.file ? [req.file] : [])).forEach((f) => deleteUpload(`/uploads/${f.filename}`));

// ───────────── public ─────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/site', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(getSite());
});

// ───────────── admin ─────────────

app.post('/api/admin/login', login);

const admin = express.Router();
admin.use(requireAdmin);

// Add a piece. multipart: title, blurb, instagram, files[]
admin.post('/pieces', upload.array('files'), async (req, res) => {
  try {
    const title = text(req.body.title, { field: 'Title', max: 120, required: true });
    const blurb = text(req.body.blurb, { field: 'Description', max: 1500 });
    const instagram = url(req.body.instagram, 'Instagram link');
    const media = (req.files || []).map(toMedia);
    if (!media.some((m) => m.type === 'image')) throw new BadRequest('Add at least one image.');

    const site = getSite();
    const piece = { id: newId(), slug: uniqueSlug(title), title, blurb, instagram, media };
    site.pieces.unshift(piece); // newest first
    await save();
    res.status(201).json(piece);
  } catch (err) {
    discardUploads(req);
    throw err;
  }
});

// Edit a piece. multipart: title, blurb, instagram, media (JSON list of existing srcs to keep, in order), files[] (appended)
admin.put('/pieces/:id', upload.array('files'), async (req, res) => {
  try {
    const piece = findPiece(req.params.id);
    const title = text(req.body.title, { field: 'Title', max: 120, required: true });
    const blurb = text(req.body.blurb, { field: 'Description', max: 1500 });
    const instagram = url(req.body.instagram, 'Instagram link');

    const keepSrcs = parseJson(req.body.media ?? '[]', 'Media list');
    if (!Array.isArray(keepSrcs)) throw new BadRequest('Media list is malformed.');
    const kept = keepSrcs.map((src) => {
      const m = piece.media.find((x) => x.src === src);
      if (!m) throw new BadRequest('Media list refers to a file that is not part of this piece.');
      return m;
    });
    const media = [...kept, ...(req.files || []).map(toMedia)];
    if (!media.some((m) => m.type === 'image')) throw new BadRequest('A piece needs at least one image.');

    const removed = piece.media.filter((m) => !media.includes(m));
    Object.assign(piece, { title, blurb, instagram, media, slug: title === piece.title ? piece.slug : uniqueSlug(title, piece.id) });
    await save();
    removed.forEach((m) => deleteUpload(m.src));
    res.json(piece);
  } catch (err) {
    discardUploads(req);
    throw err;
  }
});

admin.delete('/pieces/:id', async (req, res) => {
  const site = getSite();
  const piece = findPiece(req.params.id);
  site.pieces = site.pieces.filter((p) => p !== piece);
  site.featured.ids = site.featured.ids.filter((id) => id !== piece.id);
  if (piece.media.some((m) => m.src === site.about.image)) site.about.image = '';
  for (const item of [...site.posts, ...site.published]) if (piece.media.some((m) => m.src === item.cover)) item.cover = '';
  await save();
  piece.media.forEach((m) => deleteUpload(m.src));
  res.json({ ok: true });
});

// Move a piece up or down the gallery order. body: { direction: -1 | 1 }
admin.post('/pieces/:id/move', async (req, res) => {
  const site = getSite();
  const piece = findPiece(req.params.id);
  const from = site.pieces.indexOf(piece);
  const to = from + (req.body?.direction === -1 ? -1 : 1);
  if (to >= 0 && to < site.pieces.length) {
    site.pieces.splice(from, 1);
    site.pieces.splice(to, 0, piece);
    await save();
  }
  res.json({ ok: true });
});

// body: { enabled: boolean, ids: [pieceId, ...] } — ids in display order
admin.put('/featured', async (req, res) => {
  const site = getSite();
  const { enabled, ids } = req.body || {};
  if (typeof enabled !== 'boolean' || !Array.isArray(ids)) throw new BadRequest('Featured settings are malformed.');
  const known = new Set(site.pieces.map((p) => p.id));
  site.featured = { enabled, ids: [...new Set(ids)].filter((id) => known.has(id)) };
  await save();
  res.json(site.featured);
});

// multipart: the text fields below, image (existing src or ''), imageFile (optional upload)
admin.put('/about', upload.single('imageFile'), async (req, res) => {
  try {
    const site = getSite();
    const b = req.body;

    let image = imagePath(b.image, 'Photo');
    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) throw new BadRequest('The about photo must be an image.');
      image = `/uploads/${req.file.filename}`;
    }

    const previousImage = site.about.image;
    site.about = {
      heading: text(b.heading, { field: 'Heading', max: 120, required: true }),
      lead: text(b.lead, { field: 'Intro line', max: 400 }),
      body: text(b.body, { field: 'Main text', max: 6000 }),
      image,
      teaserHeading: text(b.teaserHeading, { field: 'Home page heading', max: 120 }),
      teaserText: text(b.teaserText, { field: 'Home page text', max: 1000 }),
      contactHeading: text(b.contactHeading, { field: 'Contact heading', max: 120 }),
      contactText: text(b.contactText, { field: 'Contact text', max: 1000 }),
      instagramUrl: url(b.instagramUrl, 'Instagram URL'),
      instagramHandle: text(b.instagramHandle, { field: 'Instagram handle', max: 60 }),
    };
    await save();
    // Clean up an old uploaded about photo that nothing else uses.
    if (previousImage !== image && !isInUse(previousImage)) deleteUpload(previousImage);
    res.json(site.about);
  } catch (err) {
    discardUploads(req);
    throw err;
  }
});

// ───────────── blog ─────────────

// Shared by create + edit. multipart: title, date, body, cover (existing src or ''), coverFile (optional upload)
function readPost(req) {
  const b = req.body;
  return {
    title: text(b.title, { field: 'Title', max: 160, required: true }),
    date: date(b.date),
    body: text(b.body, { field: 'Post text', max: 50000, required: true }),
    cover: readCover(req),
  };
}

admin.post('/posts', upload.single('coverFile'), async (req, res) => {
  try {
    const site = getSite();
    const fields = readPost(req);
    const post = { id: newId(), slug: uniqueSlug(fields.title, null, site.posts), ...fields };
    site.posts.push(post);
    await save();
    res.status(201).json(post);
  } catch (err) {
    discardUploads(req);
    throw err;
  }
});

admin.put('/posts/:id', upload.single('coverFile'), async (req, res) => {
  try {
    const site = getSite();
    const post = findPost(req.params.id);
    const fields = readPost(req);
    const previousCover = post.cover;
    const slug = fields.title === post.title ? post.slug : uniqueSlug(fields.title, post.id, site.posts);
    Object.assign(post, fields, { slug });
    await save();
    if (previousCover !== post.cover && !isInUse(previousCover)) deleteUpload(previousCover);
    res.json(post);
  } catch (err) {
    discardUploads(req);
    throw err;
  }
});

admin.delete('/posts/:id', async (req, res) => {
  const site = getSite();
  const post = findPost(req.params.id);
  site.posts = site.posts.filter((p) => p !== post);
  await save();
  if (!isInUse(post.cover)) deleteUpload(post.cover);
  res.json({ ok: true });
});

// ───────────── published works ─────────────

// Shared by create + edit. multipart: title, publication, year, month ('' or 1-12), description, link, cover, coverFile
function readPublished(req) {
  const b = req.body;
  const year = Number(b.year);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new BadRequest('Year must be a 4-digit year.');
  const month = b.month ? Number(b.month) : null;
  if (month !== null && !(Number.isInteger(month) && month >= 1 && month <= 12)) throw new BadRequest('Month is malformed.');
  return {
    title: text(b.title, { field: 'Title', max: 160, required: true }),
    publication: text(b.publication, { field: 'Where it was published', max: 160, required: true }),
    year,
    month,
    description: text(b.description, { field: 'Description', max: 2000 }),
    link: url(b.link, 'Link'),
    cover: readCover(req),
  };
}

admin.post('/published', upload.single('coverFile'), async (req, res) => {
  try {
    const item = { id: newId(), ...readPublished(req) };
    getSite().published.push(item);
    await save();
    res.status(201).json(item);
  } catch (err) {
    discardUploads(req);
    throw err;
  }
});

admin.put('/published/:id', upload.single('coverFile'), async (req, res) => {
  try {
    const item = findIn(getSite().published, req.params.id, 'published work');
    const fields = readPublished(req);
    const previousCover = item.cover;
    Object.assign(item, fields);
    await save();
    if (previousCover !== item.cover && !isInUse(previousCover)) deleteUpload(previousCover);
    res.json(item);
  } catch (err) {
    discardUploads(req);
    throw err;
  }
});

admin.delete('/published/:id', async (req, res) => {
  const site = getSite();
  const item = findIn(site.published, req.params.id, 'published work');
  site.published = site.published.filter((p) => p !== item);
  await save();
  if (!isInUse(item.cover)) deleteUpload(item.cover);
  res.json({ ok: true });
});

app.use('/api/admin', admin);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'A file is too large (80 MB max).' : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err instanceof BadRequest) return res.status(err.status || 400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// controllers/bookController.js
import { supabase } from '../db.js';

const COVERS_BUCKET = process.env.SUPABASE_COVERS_BUCKET || 'covers';
const BOOKS_BUCKET = process.env.SUPABASE_BOOKS_BUCKET || 'books';

function parseBase64File(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;
  const mimeType = matches[1];
  const base64Data = matches[2];
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = mimeType.split('/')[1] || 'bin';
    return { buffer, mimeType, extension };
  } catch (err) {
    console.error('[bookController] unable to parse base64 file:', err);
    return null;
  }
}

function buildStoragePath(prefix, extension) {
  const random = Math.random().toString(36).slice(2, 8);
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'file';
  return `${safePrefix}-${Date.now()}-${random}.${extension}`;
}

function buildBookPayload(body, { forCreate = false } = {}) {
  const {
    title,
    author,
    genre,
    year,
    summary,
    coverImage,
    content,
    premium,
  } = body || {};

  const payload = {};

  if (forCreate || typeof title !== 'undefined') {
    if (!title || !title.trim()) {
      return { error: 'Title is required.' };
    }
    payload.title = title.trim();
  }

  if (forCreate || typeof author !== 'undefined') {
    if (!author || !author.trim()) {
      return { error: 'Author is required.' };
    }
    payload.author = author.trim();
  }

  if (typeof genre !== 'undefined') {
    payload.genre = genre ? String(genre).trim() : null;
  }

  if (typeof year !== 'undefined') {
    if (year === null || year === '') {
      payload.year = null;
    } else {
      const parsedYear = Number(year);
      if (Number.isNaN(parsedYear)) {
        return { error: 'Year must be a number.' };
      }
      payload.year = parsedYear;
    }
  }

  if (typeof summary !== 'undefined') {
    payload.summary = summary ? String(summary).trim() : null;
  }

  if (typeof coverImage !== 'undefined') {
    payload.cover_image = coverImage || null;
  }

  if (typeof content !== 'undefined') {
    payload.content = content || null;
  }

  if (typeof premium !== 'undefined') {
    payload.premium = Boolean(premium);
  }

  return { payload };
}

// GET /api/books
export async function getBooks(req, res) {
  const { data, error } = await supabase
    .from('books')
    .select('id, author, title, genre, year, summary, cover_image, premium')
    .order('title');

  if (error) {
  console.error('Supabase getBooks error:', JSON.stringify(error, null, 2));
  return res.status(500).json({ error: 'Database error' });
  }

  return res.json(data);
}

// GET /api/books/search - Search and filter books
export async function searchBooks(req, res) {
  const { title, author, genre, year } = req.query;

  let query = supabase
    .from('books')
    .select('id, author, title, genre, year, summary, cover_image')
    .order('title');

  // Apply filters
  if (title) {
    query = query.ilike('title', `%${title}%`);
  }
  if (author) {
    query = query.ilike('author', `%${author}%`);
  }
  if (genre) {
    query = query.ilike('genre', `%${genre}%`);
  }
  if (year) {
    query = query.eq('year', Number(year));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase searchBooks error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.json(data);
}

// GET /api/books/:id
export async function getBookById(req, res) {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from('books')
    .select('id, author, title, genre, year, summary, cover_image, content, premium')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Supabase getBookById error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.json(data);
}

// POST /api/admin/books
export async function createBook(req, res) {
  const { payload, error: validationError } = buildBookPayload(req.body, { forCreate: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { data, error } = await supabase
    .from('books')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('Supabase createBook error:', error);
    return res.status(500).json({ error: 'Unable to create book.' });
  }

  return res.status(201).json(data);
}

// PUT /api/admin/books/:id
export async function updateBook(req, res) {
  const bookId = Number(req.params.id);
  if (!bookId) {
    return res.status(400).json({ error: 'Invalid book id.' });
  }

  const { payload, error: validationError } = buildBookPayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update.' });
  }

  const { data, error } = await supabase
    .from('books')
    .update(payload)
    .eq('id', bookId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Supabase updateBook error:', error);
    return res.status(500).json({ error: 'Unable to update book.' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  return res.json(data);
}

// DELETE /api/admin/books/:id
export async function deleteBook(req, res) {
  const bookId = Number(req.params.id);
  if (!bookId) {
    return res.status(400).json({ error: 'Invalid book id.' });
  }

  const { data, error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Supabase deleteBook error:', error);
    return res.status(500).json({ error: 'Unable to delete book.' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  return res.status(204).send();
}

export async function uploadCover(req, res) {
  const { file, filename } = req.body || {};
  if (!file) {
    return res.status(400).json({ error: 'File payload is required.' });
  }

  if (!COVERS_BUCKET) {
    return res.status(500).json({ error: 'Covers bucket not configured.' });
  }

  const parsed = parseBase64File(file);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid base64 file payload.' });
  }

  const path = buildStoragePath(filename || 'cover', parsed.extension);
  const { error: uploadError } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error('[uploadCover] upload error:', uploadError);
    return res.status(500).json({ error: 'Unable to upload cover.' });
  }

  const { data: urlData, error: urlError } = supabase.storage
    .from(COVERS_BUCKET)
    .getPublicUrl(path);

  if (urlError || !urlData?.publicUrl) {
    console.error('[uploadCover] public url error:', urlError);
    return res.status(500).json({ error: 'Unable to generate cover URL.' });
  }

  return res.status(201).json({
    path: `${COVERS_BUCKET}/${path}`,
    url: urlData.publicUrl,
  });
}

export async function uploadBookFile(req, res) {
  const { file, filename } = req.body || {};
  if (!file) {
    return res.status(400).json({ error: 'File payload is required.' });
  }

  if (!BOOKS_BUCKET) {
    return res.status(500).json({ error: 'Books bucket not configured.' });
  }

  const parsed = parseBase64File(file);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid base64 file payload.' });
  }

  const path = buildStoragePath(filename || 'book', parsed.extension);
  const { error: uploadError } = await supabase.storage
    .from(BOOKS_BUCKET)
    .upload(path, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error('[uploadBookFile] upload error:', uploadError);
    return res.status(500).json({ error: 'Unable to upload book file.' });
  }

  const { data: urlData, error: urlError } = supabase.storage
    .from(BOOKS_BUCKET)
    .getPublicUrl(path);

  if (urlError || !urlData?.publicUrl) {
    console.error('[uploadBookFile] public url error:', urlError);
    return res.status(500).json({ error: 'Unable to generate file URL.' });
  }

  return res.status(201).json({
    path: `${BOOKS_BUCKET}/${path}`,
    url: urlData.publicUrl,
  });
}

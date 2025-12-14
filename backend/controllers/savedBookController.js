import { supabase } from '../db.js';

const SAVED_BOOKS_TABLE = process.env.SUPABASE_SAVED_BOOKS_TABLE || 'saved_books';

function ensureTableConfigured(res) {
  if (!SAVED_BOOKS_TABLE) {
    res.status(500).json({ error: 'Saved books table not configured on server.' });
    return false;
  }
  return true;
}

export async function listSavedBooks(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { data, error } = await supabase
    .from(SAVED_BOOKS_TABLE)
    .select('book_id')
    .eq('account_id', userId);

  if (error) {
    console.error('[savedBookController] listSavedBooks error:', error);
    return res.status(500).json({ error: 'Unable to load saved books.' });
  }

  const savedBookIds = data.map((row) => row.book_id);
  return res.json({ savedBookIds });
}

export async function addSavedBook(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const bookId = Number(req.body?.bookId);
  if (!bookId || Number.isNaN(bookId)) {
    return res.status(400).json({ error: 'Valid bookId is required.' });
  }

  const { error } = await supabase
    .from(SAVED_BOOKS_TABLE)
    .upsert(
      { account_id: userId, book_id: bookId },
      { onConflict: 'account_id,book_id' },
    );

  if (error) {
    console.error('[savedBookController] addSavedBook error:', error);
    return res.status(500).json({ error: 'Unable to save this book.' });
  }

  return res.status(201).json({ bookId });
}

export async function removeSavedBook(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const bookId = Number(req.params.bookId);
  if (!bookId || Number.isNaN(bookId)) {
    return res.status(400).json({ error: 'Valid bookId is required.' });
  }

  const { error } = await supabase
    .from(SAVED_BOOKS_TABLE)
    .delete()
    .eq('account_id', userId)
    .eq('book_id', bookId);

  if (error) {
    console.error('[savedBookController] removeSavedBook error:', error);
    return res.status(500).json({ error: 'Unable to remove this book.' });
  }

  return res.status(204).send();
}

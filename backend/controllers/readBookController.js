import { supabase } from '../db.js';

const READ_BOOKS_TABLE = process.env.SUPABASE_READ_BOOKS_TABLE || 'read_books';

function ensureTableConfigured(res) {
  if (!READ_BOOKS_TABLE) {
    res.status(500).json({ error: 'Read books table not configured on server.' });
    return false;
  }
  return true;
}

export async function listReadBooks(req, res) {
  try {
    if (!ensureTableConfigured(res)) return;

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { data, error } = await supabase
      .from(READ_BOOKS_TABLE)
      .select('book_id')
      .eq('account_id', userId);

    if (error) {
      console.error('[readBookController] listReadBooks error:', error);
      return res.status(500).json({ error: 'Unable to load read books.' });
    }

    const readBookIds = data.map((row) => row.book_id);
    return res.json({ readBookIds });
  } catch (err) {
    console.error('[readBookController] Unexpected error in listReadBooks', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}

export async function addReadBook(req, res) {
  try {
    if (!ensureTableConfigured(res)) return;

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    console.log('[readBookController] addReadBook called', { userId, body: req.body });

    const bookId = Number(req.body?.bookId);
    if (!bookId || Number.isNaN(bookId)) {
      return res.status(400).json({ error: 'Valid bookId is required.' });
    }

    const { error } = await supabase
      .from(READ_BOOKS_TABLE)
      .upsert(
        { account_id: userId, book_id: bookId },
        { onConflict: 'account_id,book_id' },
      );

    if (error) {
      console.error('[readBookController] addReadBook error:', error);
      try {
        console.error('[readBookController] supabase error details:', JSON.stringify(error));
      } catch (e) {
        // ignore stringify errors
      }
      return res.status(500).json({ error: 'Unable to mark this book as read.' });
    }

    return res.status(201).json({ bookId });
  } catch (err) {
    console.error('[readBookController] Unexpected error in addReadBook', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}

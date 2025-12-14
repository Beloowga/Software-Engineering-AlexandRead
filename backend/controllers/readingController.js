import { supabase } from '../db.js';

const READING_TABLE = process.env.SUPABASE_READING_TABLE || 'acc_reading';

function ensureTableConfigured(res) {
  if (!READING_TABLE) {
    res.status(500).json({ error: 'Reading activity table not configured on server.' });
    return false;
  }
  return true;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function listCurrentReading(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { data, error } = await supabase
    .from(READING_TABLE)
    .select(`
      user_id,
      book_id,
      start_read_date,
      end_read_date,
      is_finished,
      book:books (
        id,
        title,
        author,
        cover_image,
        genre,
        year,
        premium
      )
    `)
    .eq('user_id', userId)
    .or('is_finished.eq.false,end_read_date.is.null')
    .order('start_read_date', { ascending: false });

  if (error) {
    console.error('[readingController] listCurrentReading error:', error);
    return res.status(500).json({ error: 'Unable to load reading activity.' });
  }

  return res.json({ entries: data || [] });
}

export async function listReadingHistory(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { data, error } = await supabase
    .from(READING_TABLE)
    .select(`
      user_id,
      book_id,
      start_read_date,
      end_read_date,
      is_finished,
      book:books (
        id,
        title,
        author,
        cover_image,
        genre,
        year,
        premium
      )
    `)
    .eq('user_id', userId)
    .or('is_finished.eq.true,end_read_date.not.is.null')
    .order('end_read_date', { ascending: false, nullsFirst: false })
    .order('start_read_date', { ascending: false });

  if (error) {
    console.error('[readingController] listReadingHistory error:', error);
    return res.status(500).json({ error: 'Unable to load reading history.' });
  }

  return res.json({ entries: data || [] });
}

export async function getReadingStatus(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const bookId = Number(req.params.bookId);
  if (!bookId || Number.isNaN(bookId)) {
    return res.status(400).json({ error: 'Valid bookId is required.' });
  }

  const { data, error } = await supabase
    .from(READING_TABLE)
    .select('book_id, start_read_date, end_read_date, is_finished')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .order('start_read_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[readingController] getReadingStatus error:', error);
    return res.status(500).json({ error: 'Unable to fetch reading status.' });
  }

  return res.json({ entry: data || null });
}

export async function startReading(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const bookId = Number(req.params.bookId);
  if (!bookId || Number.isNaN(bookId)) {
    return res.status(400).json({ error: 'Valid bookId is required.' });
  }

  const { data: existing, error: fetchError } = await supabase
    .from(READING_TABLE)
    .select('user_id, book_id, start_read_date, end_read_date, is_finished')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .order('start_read_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('[readingController] startReading fetch error:', fetchError);
    return res.status(500).json({ error: 'Unable to check existing reading entry.' });
  }

  // If an active entry already exists, just return it.
  if (existing && !existing.is_finished && !existing.end_read_date) {
    return res.json({ entry: existing });
  }

  const payload = {
    start_read_date: todayDate(),
    end_read_date: null,
    is_finished: false,
  };

  let result;
  if (existing) {
    result = await supabase
      .from(READING_TABLE)
      .update(payload)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .select('user_id, book_id, start_read_date, end_read_date, is_finished')
      .maybeSingle();
  } else {
    result = await supabase
      .from(READING_TABLE)
      .insert([{ user_id: userId, book_id: bookId, ...payload }])
      .select('user_id, book_id, start_read_date, end_read_date, is_finished')
      .maybeSingle();
  }

  const { data, error } = result;
  if (error) {
    console.error('[readingController] startReading upsert error:', error);
    return res.status(500).json({ error: 'Unable to log reading start.' });
  }

  return res.status(existing ? 200 : 201).json({ entry: data });
}

export async function finishReading(req, res) {
  if (!ensureTableConfigured(res)) return;

  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const bookId = Number(req.params.bookId);
  if (!bookId || Number.isNaN(bookId)) {
    return res.status(400).json({ error: 'Valid bookId is required.' });
  }

  const { data: existing, error: fetchError } = await supabase
    .from(READING_TABLE)
    .select('user_id, book_id, start_read_date, end_read_date, is_finished')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .order('start_read_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('[readingController] finishReading fetch error:', fetchError);
    return res.status(500).json({ error: 'Unable to fetch reading entry.' });
  }

  if (!existing) {
    return res.status(404).json({ error: 'Reading entry not found.' });
  }

  if (existing.is_finished || existing.end_read_date) {
    return res.status(400).json({ error: 'This book is already marked as finished.' });
  }

  const endDate = todayDate();
  const startDate = existing.start_read_date || endDate;

  const { data, error } = await supabase
    .from(READING_TABLE)
    .update({
      start_read_date: startDate,
      end_read_date: endDate,
      is_finished: true,
    })
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .select('user_id, book_id, start_read_date, end_read_date, is_finished')
    .maybeSingle();

  if (error) {
    console.error('[readingController] finishReading update error:', error);
    return res.status(500).json({ error: 'Unable to mark book as finished.' });
  }

  return res.json({ entry: data });
}

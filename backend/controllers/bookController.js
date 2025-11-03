// controllers/bookController.js
import { supabase } from '../db.js';

// GET /api/books
export async function getBooks(req, res) {
  const { data, error } = await supabase
    .from('books')
    .select('id, author, title, genre, year, summary, cover_image')
    .order('title');

  if (error) {
    console.error('Supabase getBooks error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  return res.json(data);
}

// GET /api/books/:id
export async function getBookById(req, res) {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from('books')
    .select('id, author, title, genre, year, summary, cover_image, content')
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

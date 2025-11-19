import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../db.js';

const ACCOUNT_TABLE = process.env.SUPABASE_ACCOUNT_TABLE || 'account';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  console.warn('[authController] JWT_SECRET is missing. Auth routes will fail until it is provided.');
}

export function sanitizeEmail(email = '') {
  return email.trim().toLowerCase();
}

export function normalizeGenres(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((genre) => genre.trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean);
  }
  return [];
}

export function toProfileResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    pseudo: row.pseudo,
    name: row.name ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    region: row.region ?? null,
    favouriteBook: row.favourite_book ?? null,
    favouriteAuthor: row.favourite_author ?? null,
    favouriteGenres: row.favourite_genres || [],
    avatarUrl: row.avatar_url || null,
    role: row.role ?? null,
    subscription: {
      value: row.sub_value ?? null,
      start: row.start_sub_date ?? null,
      end: row.end_sub_date ?? null,
    },
    createdAt: row.created_at,
  };
}

function createToken(profile) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET missing');
  }
  return jwt.sign(
    { sub: profile.id, email: profile.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function findProfileByEmail(email) {
  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('[authController] findProfileByEmail error:', error);
    throw new Error('DATABASE_ERROR');
  }
  return data;
}

export async function register(req, res) {
  try {
    const {
      email,
      password,
      pseudo,
      name,
      dateOfBirth,
      region,
      favouriteBook,
      favouriteAuthor,
      favouriteGenres,
      role,
      subscriptionValue,
      subscriptionStart,
      subscriptionEnd,
    } = req.body || {};

    if (!email || !password || !pseudo) {
      return res.status(400).json({ error: 'Email, password and pseudo are required.' });
    }

    const normalizedEmail = sanitizeEmail(email);
    const genres = normalizeGenres(favouriteGenres);

    const existingProfile = await findProfileByEmail(normalizedEmail);
    if (existingProfile) {
      return res.status(409).json({ error: 'An account already exists with this email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertPayload = {
      email: normalizedEmail,
      password: passwordHash,
      pseudo,
      name: name || null,
      date_of_birth: dateOfBirth || null,
      region: region || null,
      favourite_book: favouriteBook || null,
      favourite_author: favouriteAuthor || null,
      favourite_genres: genres.length ? genres : null,
      role: role || 'user',
      sub_value: subscriptionValue ?? null,
      start_sub_date: subscriptionStart || null,
      end_sub_date: subscriptionEnd || null,
    };

    const { data, error } = await supabase
      .from(ACCOUNT_TABLE)
      .insert([
        insertPayload,
      ])
      .select('*')
      .single();

    if (error) {
      console.error('[authController] register error:', error);
      return res.status(500).json({ error: 'Unable to create account.' });
    }

    const token = createToken(data);
    return res.status(201).json({
      token,
      profile: toProfileResponse(data),
    });
  } catch (err) {
    if (err.message === 'DATABASE_ERROR') {
      return res.status(500).json({ error: 'Database error.' });
    }
    console.error('[authController] register exception:', err);
    return res.status(500).json({ error: 'Unexpected error during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = sanitizeEmail(email);
    const profile = await findProfileByEmail(normalizedEmail);

    if (!profile) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, profile.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = createToken(profile);
    return res.json({
      token,
      profile: toProfileResponse(profile),
    });
  } catch (err) {
    if (err.message === 'DATABASE_ERROR') {
      return res.status(500).json({ error: 'Database error.' });
    }
    console.error('[authController] login exception:', err);
    return res.status(500).json({ error: 'Unexpected error during login.' });
  }
}

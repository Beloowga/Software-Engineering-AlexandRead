import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { supabase } from '../db.js';
import {
  normalizeGenres,
  sanitizeEmail,
  toProfileResponse,
} from './authController.js';

const ACCOUNT_TABLE = process.env.SUPABASE_ACCOUNT_TABLE || 'account';
const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';
const MAX_AVATAR_BYTES = Number(process.env.AVATAR_MAX_FILE_BYTES || 3 * 1024 * 1024);
const READING_TABLE = process.env.SUPABASE_READING_TABLE || 'acc_reading';
const SAVED_BOOKS_TABLE = process.env.SUPABASE_SAVED_BOOKS_TABLE || null;

function buildNullableText(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return value ?? null;
}

function parseBase64Image(dataUrl) {
  if (typeof dataUrl !== 'string') {
    return null;
  }
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) return null;
  const mimeType = matches[1];
  const base64Data = matches[2];
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const parts = mimeType.split('/');
    const extension = parts[1] || 'png';
    return { buffer, mimeType, extension };
  } catch (err) {
    console.error('[accountController] unable to parse base64 image:', err);
    return null;
  }
}

function extractAvatarPath(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = '/storage/v1/object/public/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const pathWithBucket = url.slice(index + marker.length);
  if (!pathWithBucket) return null;
  if (pathWithBucket.startsWith(`${AVATAR_BUCKET}/`)) {
    return pathWithBucket.slice(AVATAR_BUCKET.length + 1);
  }
  return pathWithBucket;
}

export async function getCurrentProfile(req, res) {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[accountController] getCurrentProfile error:', error);
    return res.status(500).json({ error: 'Database error.' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Profile not found.' });
  }

  return res.json({ profile: toProfileResponse(data) });
}

export async function updateProfile(req, res) {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const {
    email,
    pseudo,
    name,
    dateOfBirth,
    region,
    favouriteBook,
    favouriteAuthor,
    favouriteGenres,
    password,
  } = req.body || {};

  const updates = {};

  if (typeof email !== 'undefined') {
    const normalizedEmail = sanitizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    updates.email = normalizedEmail;
  }

  if (typeof pseudo !== 'undefined') {
    const trimmedPseudo = (pseudo || '').toString().trim();
    if (!trimmedPseudo) {
      return res.status(400).json({ error: 'Pseudo cannot be empty.' });
    }
    updates.pseudo = trimmedPseudo;
  }

  if (typeof name !== 'undefined') {
    updates.name = buildNullableText(name);
  }
  if (typeof dateOfBirth !== 'undefined') {
    updates.date_of_birth = dateOfBirth || null;
  }
  if (typeof region !== 'undefined') {
    updates.region = buildNullableText(region);
  }
  if (typeof favouriteBook !== 'undefined') {
    updates.favourite_book = buildNullableText(favouriteBook);
  }
  if (typeof favouriteAuthor !== 'undefined') {
    updates.favourite_author = buildNullableText(favouriteAuthor);
  }
  if (typeof favouriteGenres !== 'undefined') {
    const genres = normalizeGenres(favouriteGenres);
    updates.favourite_genres = genres.length ? genres : null;
  }
  if (typeof password === 'string' && password.trim()) {
    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must contain at least 6 characters.' });
    }
    updates.password = await bcrypt.hash(password.trim(), 10);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Please provide at least one field to update.' });
  }

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('[accountController] updateProfile error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This email is already used by another account.' });
    }
    return res.status(500).json({ error: 'Unable to update profile.' });
  }

  return res.json({ profile: toProfileResponse(data) });
}

export async function uploadAvatar(req, res) {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  if (!AVATAR_BUCKET) {
    console.error('[accountController] Missing SUPABASE_AVATAR_BUCKET configuration.');
    return res.status(500).json({ error: 'Avatar bucket not configured on server.' });
  }

  const parsed = parseBase64Image(image);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid image payload.' });
  }

  if (parsed.buffer.length > MAX_AVATAR_BYTES) {
    return res.status(400).json({ error: 'Avatar file is too large.' });
  }

  const uniqueId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
  const filePath = `${userId}/${Date.now()}-${uniqueId}.${parsed.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error('[accountController] uploadAvatar error:', uploadError);
    return res.status(500).json({ error: 'Unable to upload avatar.' });
  }

  const { data: urlData, error: publicUrlError } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  if (publicUrlError || !urlData?.publicUrl) {
    console.error('[accountController] getPublicUrl error:', publicUrlError);
    return res.status(500).json({ error: 'Unable to generate avatar URL.' });
  }

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('[accountController] avatar profile update error:', error);
    return res.status(500).json({ error: 'Unable to attach avatar to profile.' });
  }

  return res.json({ profile: toProfileResponse(data) });
}

export async function deleteAccount(req, res) {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { data: profile, error: fetchError } = await supabase
    .from(ACCOUNT_TABLE)
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('[accountController] deleteAccount fetch error:', fetchError);
    return res.status(500).json({ error: 'Unable to fetch profile before deletion.' });
  }

  const avatarPath = extractAvatarPath(profile?.avatar_url);
  if (avatarPath) {
    const { error: removeError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([avatarPath]);
    if (removeError) {
      console.warn('[accountController] deleteAccount avatar cleanup error:', removeError);
    }
  }

  async function cleanupTable(tableName, column) {
    if (!tableName) return;
    const { error: cleanupError } = await supabase
      .from(tableName)
      .delete()
      .eq(column, userId);
    if (cleanupError) {
      console.warn(`[accountController] cleanup for ${tableName} failed:`, cleanupError);
    }
  }

  await cleanupTable(READING_TABLE, 'user_id');
  await cleanupTable(SAVED_BOOKS_TABLE, 'account_id');

  const { error } = await supabase
    .from(ACCOUNT_TABLE)
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('[accountController] deleteAccount delete error:', error);
    return res.status(500).json({ error: 'Unable to delete account. Check related records.' });
  }

  return res.status(204).send();
}

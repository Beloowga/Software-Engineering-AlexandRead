import jwt from 'jsonwebtoken';
import { supabase } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCOUNT_TABLE = process.env.SUPABASE_ACCOUNT_TABLE || 'account';

if (!JWT_SECRET) {
  console.warn('[authMiddleware] Missing JWT_SECRET in environment variables.');
}

export function requireAuth(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'JWT secret missing on server.' });
  }

  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.auth = {
      userId: decoded.sub,
      email: decoded.email,
    };
    return next();
  } catch (err) {
    console.error('[requireAuth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export async function requireAdmin(req, res, next) {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .select('id, role')
    .eq('id', req.auth.userId)
    .maybeSingle();

  if (error) {
    console.error('[requireAdmin] Failed to load account role', error);
    return res.status(500).json({ error: 'Unable to verify permissions.' });
  }

  if (!data || data.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }

  req.auth.role = data.role;
  return next();
}

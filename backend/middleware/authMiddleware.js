import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

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

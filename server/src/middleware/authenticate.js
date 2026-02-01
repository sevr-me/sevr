import { verifyAccessToken } from '../auth.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  const result = verifyAccessToken(token);

  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  req.userId = result.userId;
  req.userEmail = result.email;
  req.isAdmin = result.isAdmin;
  next();
}

// Optional authentication - doesn't fail if no token provided
export function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  const result = verifyAccessToken(token);

  if (result.success) {
    req.userId = result.userId;
    req.userEmail = result.email;
    req.isAdmin = result.isAdmin;
  }

  next();
}

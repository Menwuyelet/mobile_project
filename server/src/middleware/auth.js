const jwt = require('jsonwebtoken');
const User = require('../models/User');

const resolveBearerToken = (authHeader = '') => {
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return '';
  }
  return token;
};

const requireAuth = async (req, res, next) => {
  const token = resolveBearerToken(req.headers.authorization || '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token user.' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account is suspended. Please contact admin.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const optionalAuth = async (req, _res, next) => {
  const token = resolveBearerToken(req.headers.authorization || '');
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user || user.isSuspended) {
      req.user = null;
      return next();
    }

    req.user = user;
    return next();
  } catch (_error) {
    req.user = null;
    return next();
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin role required.' });
  }
  next();
};

module.exports = { requireAuth, optionalAuth, requireAdmin };

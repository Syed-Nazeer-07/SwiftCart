const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }
  try {
    const token = header.slice(7).trim();
    if (!token) return res.status(401).json({ message: 'Not authorized, no token.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Session invalid or expired. Please sign in again.' });
  }
};

const admin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Administrator access required.' });
};

module.exports = { protect, admin };

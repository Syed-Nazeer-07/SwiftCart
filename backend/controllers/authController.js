const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const normalizedEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';

const registerUser = async (req, res) => {
  const { name, email, password } = req.body || {};
  const safeName = typeof name === 'string' ? name.trim() : '';
  const safeEmail = normalizedEmail(email);
  if (safeName.length < 2 || safeName.length > 80 ||
    safeEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail) ||
    typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Enter a name, valid email and password of at least 8 characters.' });
  }
  try {
    const exists = await User.findOne({ email: safeEmail });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });
    // Do not copy role from request.body: every public registration is a customer.
    const user = await User.create({ name: safeName, email: safeEmail, password, role: 'user' });
    return res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    console.error('Registration failed:', error);
    return res.status(500).json({ message: 'Could not create account.' });
  }
};

const loginUser = async (req, res) => {
  const email = normalizedEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== 'string') {
    return res.status(400).json({ message: 'Enter your email and password.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    return res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Unable to sign in right now.' });
  }
};

const getUsers = async (req, res) => {
  try {
    // Never return bcrypt hashes to client dashboards, including admins.
    const users = await User.find({}).select('name email role createdAt');
    return res.json(users);
  } catch (error) {
    console.error('Admin users request failed:', error);
    return res.status(500).json({ message: 'Could not load users.' });
  }
};

module.exports = { registerUser, loginUser, getUsers };

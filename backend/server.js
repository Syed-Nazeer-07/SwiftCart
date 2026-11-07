require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { getPreviewProducts, getPreviewProduct } = require('./lib/previewCatalog');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
app.disable('x-powered-by');
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',').map((value) => value.trim()).filter(Boolean);

app.use(cors(allowedOrigins.length ? {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not permitted.'));
  },
} : {}));
app.use(express.json({ limit: '32kb' }));

const databaseConfigured = () => Boolean(process.env.MONGO_URI);
const authConfigured = () => Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);
const readyToServe = () => databaseConfigured() && authConfigured();

app.get('/api/health', (req, res) => {
  res.json({
    service: 'swiftcart-api',
    status: readyToServe() ? (mongoose.connection.readyState === 1 ? 'ready' : 'configured') : 'setup_required',
    database: databaseConfigured() ? 'configured' : 'not_configured',
    authentication: authConfigured() ? 'configured' : 'not_configured',
    demoCatalog: !databaseConfigured(),
    payments: 'demo_only',
  });
});

// Public read-only preview. Checkout and accounts remain disabled until
// real database and authentication secrets have been configured.
app.get('/api/products', (req, res, next) => {
  if (databaseConfigured()) return next();
  res.json(getPreviewProducts(req.query));
});
app.get('/api/products/:id', (req, res, next) => {
  if (databaseConfigured()) return next();
  const product = getPreviewProduct(req.params.id);
  if (!product) return res.status(404).json({ message: 'Preview product not found.' });
  return res.json(product);
});

app.use('/api', async (req, res, next) => {
  if (!readyToServe()) {
    return res.status(503).json({
      code: 'SETUP_REQUIRED',
      message: 'Storefront preview only. Accounts and checkout require a connected MongoDB database.',
    });
  }
  try {
    await connectDB();
    return next();
  } catch (error) {
    console.error('SwiftCart database connection failed:', error.code || error.name);
    return res.status(503).json({
      code: 'DATABASE_UNAVAILABLE',
      message: 'The store database is unavailable. Please try again later.',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('SwiftCart request failed:', error.name);
  return res.status(500).json({ message: 'The request could not be completed.' });
});

if (require.main === module) {
  if (!readyToServe()) {
    console.warn('Preview mode: MongoDB and JWT_SECRET must be configured to enable checkout.');
    app.listen(process.env.PORT || 5000);
  } else {
    connectDB()
      .then(() => app.listen(process.env.PORT || 5000))
      .catch((error) => {
        console.error('SwiftCart startup failed:', error.message);
        process.exitCode = 1;
      });
  }
}
module.exports = app;

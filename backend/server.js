require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
app.disable('x-powered-by');

const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',').map((value) => value.trim()).filter(Boolean);

// Configure FRONTEND_ORIGINS in production to limit browser origins.
// CORS is not authentication; all protected routes still require JWTs.
app.use(cors(allowedOrigins.length ? {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not permitted.'));
  },
} : {}));
app.use(express.json({ limit: '32kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'swiftcart-api' });
});

if (require.main === module) {
  // Never accept orders before the database is ready.
  connectDB()
    .then(() => {
      const port = process.env.PORT || 5000;
      app.listen(port, () => console.log('SwiftCart backend listening on port', port));
    })
    .catch((error) => {
      console.error('SwiftCart startup failed:', error.message);
      process.exitCode = 1;
    });
}

module.exports = app;

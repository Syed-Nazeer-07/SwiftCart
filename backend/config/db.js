const mongoose = require('mongoose');

let pendingConnection = null;
async function connectDB() {
  if (!process.env.MONGO_URI) {
    const error = new Error('MongoDB connection is not configured.');
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!pendingConnection) {
    pendingConnection = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 7000,
      maxPoolSize: 5,
    }).then((mongooseInstance) => {
      console.log('SwiftCart database connection established.');
      return mongooseInstance.connection;
    }).catch((error) => {
      pendingConnection = null;
      throw error;
    });
  }
  return pendingConnection;
}

module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured.');
  const connection = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('MongoDB connected:', connection.connection.host);
  return connection;
};

module.exports = connectDB;

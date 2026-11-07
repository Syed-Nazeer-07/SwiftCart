const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 4000 },
  price: { type: Number, required: true, min: 0.01, max: 1000000 },
  originalPrice: { type: Number, min: 0 },
  image: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String },
  stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
  rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

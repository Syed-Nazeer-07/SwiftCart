const Product = require('../models/Product');

const safeRegex = (text) => String(text).trim().slice(0, 80).replace(/[.*+?^\${}()|[\]\\]/g, '\\const Product = require('../models/Product');');


const getProducts = async (req, res) => {
  try {
    const query = {};
    if (typeof req.query.keyword === 'string' && req.query.keyword.trim()) {
      const keyword = safeRegex(req.query.keyword);
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    if (req.query.bestseller === 'true') {
      query.bestseller = true;
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product data.' });
    }
    console.error('Product operation failed:', error);
    res.status(500).json({ message: 'Product request failed.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product data.' });
    }
    console.error('Product operation failed:', error);
    res.status(500).json({ message: 'Product request failed.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { title, description, price, image, category, stock, rating } = req.body;
    const product = new Product({
      title, description, price, image, category, stock, rating
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product data.' });
    }
    console.error('Product operation failed:', error);
    res.status(500).json({ message: 'Product request failed.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { title, description, price, image, category, stock, rating } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (product) {
      if (title !== undefined) product.title = title;
      if (description !== undefined) product.description = description;
      if (price !== undefined) product.price = price;
      if (image !== undefined) product.image = image;
      if (category !== undefined) product.category = category;
      product.stock = stock !== undefined ? stock : product.stock;
      product.rating = rating !== undefined ? rating : product.rating;
      
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product data.' });
    }
    console.error('Product operation failed:', error);
    res.status(500).json({ message: 'Product request failed.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product data.' });
    }
    console.error('Product operation failed:', error);
    res.status(500).json({ message: 'Product request failed.' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };

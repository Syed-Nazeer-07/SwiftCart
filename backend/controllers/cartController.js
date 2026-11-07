const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { MAX_QUANTITY } = require('../lib/orderRules');

const validId = (id) => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);
const quantityValid = (q) => Number.isInteger(q) && q >= 1 && q <= MAX_QUANTITY;
const respondError = (res, error) => {
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid cart data.' });
  }
  console.error('Cart operation failed:', error);
  return res.status(500).json({ message: 'Cart service temporarily unavailable.' });
};

const populated = (cartId) => Cart.findById(cartId).populate('products.productId');

const getCart = async (req, res) => {
  try {
    // An upsert avoids accidentally creating multiple carts from parallel reads.
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { products: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('products.productId');
    return res.json(cart);
  } catch (error) { return respondError(res, error); }
};

const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  if (!validId(productId) || !quantityValid(quantity)) {
    return res.status(400).json({ message: 'Choose a valid product and quantity (1–20).' });
  }
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'This product is no longer available.' });

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { products: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const existing = cart.products.find((item) => item.productId.toString() === productId);
    const requested = quantity + (existing?.quantity || 0);
    if (requested > MAX_QUANTITY || requested > product.stock) {
      return res.status(409).json({ message: 'Requested quantity exceeds available stock or the cart limit.' });
    }
    if (existing) existing.quantity = requested;
    else cart.products.push({ productId, quantity });
    await cart.save();
    return res.status(201).json(await populated(cart._id));
  } catch (error) { return respondError(res, error); }
};

const removeFromCart = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid product identifier.' });
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    cart.products = cart.products.filter((item) => item.productId.toString() !== req.params.id);
    await cart.save();
    return res.json(await populated(cart._id));
  } catch (error) { return respondError(res, error); }
};

const updateCartQuantity = async (req, res) => {
  const { quantity } = req.body || {};
  if (!validId(req.params.id) || !Number.isInteger(quantity) ||
      quantity < 0 || quantity > MAX_QUANTITY) {
    return res.status(400).json({ message: 'Choose a whole number of items between 0 and 20.' });
  }
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    const item = cart.products.find((part) => part.productId.toString() === req.params.id);
    if (!item) return res.status(404).json({ message: 'Product not found in cart.' });
    if (quantity > 0) {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product no longer available.' });
      if (quantity > product.stock) {
        return res.status(409).json({ message: 'Only ' + product.stock + ' items available.' });
      }
      item.quantity = quantity;
    } else {
      cart.products = cart.products.filter((part) => part.productId.toString() !== req.params.id);
    }
    await cart.save();
    return res.json(await populated(cart._id));
  } catch (error) { return respondError(res, error); }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    cart.products = [];
    await cart.save();
    return res.json(await populated(cart._id));
  } catch (error) { return respondError(res, error); }
};

module.exports = { getCart, addToCart, removeFromCart, updateCartQuantity, clearCart };

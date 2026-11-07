const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const {
  CommerceError, validateCartLines, validateShippingAddress, priceOrder, validateStatusTransition,
} = require('../lib/orderRules');

function handleOrderError(error, res) {
  if (error instanceof CommerceError) return res.status(error.status).json({ message: error.message });
  console.error('Order operation failed:', error);
  return res.status(500).json({ message: 'The order could not be processed. Please retry.' });
}

/**
 * MongoDB transaction: all-or-nothing inventory reservation, order creation,
 * and cart clearing. The browser never supplies trusted item prices or totals.
 * Requires MongoDB Atlas / replica-set deployment.
 */
const createOrder = async (req, res) => {
  let session;
  try {
    const shippingAddress = validateShippingAddress(req.body?.shippingAddress);
    session = await mongoose.startSession();
    let createdOrder;
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId: req.user._id }).session(session);
      const lines = validateCartLines(cart?.products);
      const ids = lines.map((line) => line.productId);
      const products = await Product.find({ _id: { $in: ids } }).session(session);
      const catalog = new Map(products.map((product) => [product._id.toString(), product]));
      const pricing = priceOrder(lines, catalog);

      for (const item of pricing.products) {
        // Conditional update handles concurrent orders racing for last stock.
        const result = await Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        );
        if (result.modifiedCount !== 1) {
          throw new CommerceError('Stock changed during checkout. Review your cart and retry.', 409);
        }
      }

      const [order] = await Order.create([{
        userId: req.user._id,
        products: pricing.products,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        totalPrice: pricing.totalPrice,
        shippingAddress,
        inventoryReserved: true,
      }], { session });
      createdOrder = order;

      const updatedCart = await Cart.updateOne(
        { _id: cart._id }, { $set: { products: [] } }, { session },
      );
      if (updatedCart.matchedCount !== 1) {
        throw new CommerceError('Your cart changed during checkout. Please retry.', 409);
      }
    });
    return res.status(201).json(createdOrder);
  } catch (error) {
    return handleOrderError(error, res);
  } finally {
    if (session) await session.endSession();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('products.productId', 'title image brand');
    return res.json(orders);
  } catch (error) {
    return handleOrderError(error, res);
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('userId', 'name email');
    return res.json(orders);
  } catch (error) {
    return handleOrderError(error, res);
  }
};

const updateOrderStatus = async (req, res) => {
  let session;
  try {
    const nextStatus = req.body?.status;
    if (typeof nextStatus !== 'string') throw new CommerceError('Choose a valid status.');
    session = await mongoose.startSession();
    let updatedOrder;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new CommerceError('Order not found.', 404);
      validateStatusTransition(order.status, nextStatus);
      if (order.status === nextStatus) {
        updatedOrder = order;
        return;
      }
      // Only newly-created transaction-backed orders have inventoryReserved.
      // Legacy historical orders never allocated stock, so cannot be restocked.
      if (nextStatus === 'Cancelled' && order.inventoryReserved) {
        for (const item of order.products) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
        order.inventoryReserved = false;
      }
      order.status = nextStatus;
      updatedOrder = await order.save({ session });
    });
    return res.json(updatedOrder);
  } catch (error) {
    return handleOrderError(error, res);
  } finally {
    if (session) await session.endSession();
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus };

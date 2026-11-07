const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { createOrder, updateOrderStatus } = require('../controllers/orderController');

const userId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const productId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const address = { address: '101 Market Street', city: 'Chennai', postalCode: '600001', country: 'India' };
const response = () => ({
  code: 200, body: null,
  status(value) { this.code = value; return this; },
  json(body) { this.body = body; return this; },
});
const mockSession = (t) => {
  const events = [];
  t.mock.method(mongoose, 'startSession', async () => ({
    withTransaction: async (callback) => {
      events.push('begin');
      await callback();
      events.push('commit');
    },
    endSession: async () => { events.push('end'); },
  }));
  return events;
};

test('checkout ignores forged browser prices and reserves stock using server catalog', async (t) => {
  const events = mockSession(t);
  const cart = {
    _id: 'cccccccccccccccccccccccc',
    products: [{ productId: { toString: () => productId }, quantity: 2 }],
  };
  t.mock.method(Cart, 'findOne', () => ({ session: async () => cart }));
  t.mock.method(Product, 'find', () => ({ session: async () => [
    { _id: { toString: () => productId }, title: 'Genuine item', price: 20.00, stock: 5 },
  ] }));
  t.mock.method(Product, 'updateOne', async (query, change, options) => {
    assert.deepEqual(query, { _id: productId, stock: { $gte: 2 } });
    assert.deepEqual(change, { $inc: { stock: -2 } });
    assert.ok(options.session);
    events.push('stock');
    return { modifiedCount: 1 };
  });
  t.mock.method(Order, 'create', async ([order], options) => {
    assert.equal(order.products[0].price, 20);
    assert.equal(order.totalPrice, 44);
    assert.equal(order.subtotal, 40);
    assert.equal(order.tax, 4);
    assert.equal(order.inventoryReserved, true);
    assert.ok(options.session);
    events.push('order');
    return [{ ...order, _id: 'new-order' }];
  });
  t.mock.method(Cart, 'updateOne', async (query, update, options) => {
    assert.deepEqual(query, { _id: cart._id });
    assert.deepEqual(update, { $set: { products: [] } });
    assert.ok(options.session);
    events.push('empty-cart');
    return { matchedCount: 1 };
  });
  const res = response();
  await createOrder({
    user: { _id: userId },
    body: {
      shippingAddress: address,
      products: [{ productId, quantity: 2, price: 0.01 }],
      totalPrice: 0.01,
    },
  }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.totalPrice, 44);
  assert.deepEqual(events, ['begin', 'stock', 'order', 'empty-cart', 'commit', 'end']);
});

test('out-of-stock checkout refuses an order without mutating stock or cart', async (t) => {
  const events = mockSession(t);
  t.mock.method(Cart, 'findOne', () => ({ session: async () => ({
    _id: 'cccccccccccccccccccccccc',
    products: [{ productId: { toString: () => productId }, quantity: 3 }],
  }) }));
  t.mock.method(Product, 'find', () => ({ session: async () => [
    { _id: { toString: () => productId }, price: 10, stock: 2 },
  ] }));
  t.mock.method(Product, 'updateOne', async () => { throw new Error('Must not reserve stock'); });
  t.mock.method(Order, 'create', async () => { throw new Error('Must not create an order'); });
  t.mock.method(Cart, 'updateOne', async () => { throw new Error('Must not clear the cart'); });
  const res = response();
  await createOrder({ user: { _id: userId }, body: { shippingAddress: address } }, res);
  assert.equal(res.code, 409);
  assert.match(res.body.message, /Insufficient stock/);
  assert.deepEqual(events, ['begin', 'end']);
});

test('cancelling an unshipped reserved order restocks once and closes the order', async (t) => {
  const events = mockSession(t);
  const order = {
    status: 'Packed', inventoryReserved: true,
    products: [{ productId, quantity: 2 }],
    async save() { events.push('save'); return this; },
  };
  t.mock.method(Order, 'findById', () => ({ session: async () => order }));
  t.mock.method(Product, 'updateOne', async (query, update) => {
    assert.deepEqual(query, { _id: productId });
    assert.deepEqual(update, { $inc: { stock: 2 } });
    events.push('restock');
    return { modifiedCount: 1 };
  });
  const res = response();
  await updateOrderStatus({ params: { id: 'some-order' }, body: { status: 'Cancelled' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.status, 'Cancelled');
  assert.equal(res.body.inventoryReserved, false);
  assert.deepEqual(events, ['begin', 'restock', 'save', 'commit', 'end']);
});

test('finalized or shipped orders cannot be cancelled or restocked', async (t) => {
  const events = mockSession(t);
  t.mock.method(Order, 'findById', () => ({ session: async () => ({
    status: 'Shipped', inventoryReserved: true, products: [{ productId, quantity: 2 }],
  }) }));
  t.mock.method(Product, 'updateOne', async () => { throw new Error('Must not restock'); });
  const res = response();
  await updateOrderStatus({ params: { id: 'some-order' }, body: { status: 'Cancelled' } }, res);
  assert.equal(res.code, 409);
  assert.match(res.body.message, /Only unshipped/);
  assert.deepEqual(events, ['begin', 'end']);
});

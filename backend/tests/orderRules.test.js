const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CommerceError, validateShippingAddress, validateCartLines, priceOrder, validateStatusTransition,
} = require('../lib/orderRules');

const idA = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const idB = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const address = { address: ' 11 High St ', city: 'Chennai', postalCode: '600001', country: 'India' };

test('shipping address is validated, bounded and trimmed', () => {
  assert.equal(validateShippingAddress(address).address, '11 High St');
  assert.throws(() => validateShippingAddress({ ...address, city: '' }), CommerceError);
  assert.throws(() => validateShippingAddress({ ...address, address: 'x'.repeat(201) }), /valid address/);
});

test('cart rejects empty, duplicate, malformed and excessive quantities', () => {
  assert.throws(() => validateCartLines([]), /1–30/);
  assert.throws(() => validateCartLines([{ productId: idA, quantity: 0 }]), /invalid/);
  assert.throws(() => validateCartLines([{ productId: idA, quantity: 1.5 }]), /invalid/);
  assert.throws(() => validateCartLines([{ productId: idA, quantity: 1 }, { productId: idA, quantity: 1 }]), /duplicate/);
  assert.equal(validateCartLines([{ productId: idA, quantity: 2 }])[0].quantity, 2);
});

test('server uses catalog prices and calculates tax with integer cents', () => {
  const data = priceOrder(validateCartLines([
    { productId: idA, quantity: 2 }, { productId: idB, quantity: 1 },
  ]), new Map([
    [idA, { title: 'Item A', price: 19.99, stock: 5 }],
    [idB, { title: 'Item B', price: 8.50, stock: 1 }],
  ]));
  assert.equal(data.subtotal, 48.48);
  assert.equal(data.tax, 4.85);
  assert.equal(data.totalPrice, 53.33);
  assert.deepEqual(data.products[0], { productId: idA, quantity: 2, price: 19.99 });
});

test('unavailable inventory and invalid catalog prices block checkout', () => {
  const lines = [{ productId: idA, quantity: 2 }];
  assert.throws(() => priceOrder(lines, new Map()), /no longer available/);
  assert.throws(() => priceOrder(lines, new Map([[idA, { price: 20, stock: 1 }]])), /Insufficient/);
  assert.throws(() => priceOrder(lines, new Map([[idA, { price: -1, stock: 5 }]])), /invalid price/);
  assert.throws(() => priceOrder(lines, new Map([[idA, { price: 10.011, stock: 5 }]])), /invalid price/);
});

test('order status cannot jump backwards, skip stages or reopen final orders', () => {
  assert.doesNotThrow(() => validateStatusTransition('Processing', 'Packed'));
  assert.doesNotThrow(() => validateStatusTransition('Packed', 'Cancelled'));
  assert.throws(() => validateStatusTransition('Processing', 'Delivered'), /next/);
  assert.throws(() => validateStatusTransition('Shipped', 'Packed'), /next/);
  assert.throws(() => validateStatusTransition('Cancelled', 'Processing'), /Completed/);
  assert.throws(() => validateStatusTransition('Processing', 'Refunded'), /Unsupported/);
});

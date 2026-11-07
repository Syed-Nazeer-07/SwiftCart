const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/Product');
const { getProducts } = require('../controllers/productController');

test('search treats regex metacharacters as literal user text', async (t) => {
  let query;
  t.mock.method(Product, 'find', async (filter) => {
    query = filter;
    return [];
  });
  let data;
  await getProducts({ query: { keyword: 'C++ [new]' } }, {
    json(value) { data = value; return this; },
    status() { return this; },
  });
  assert.deepEqual(data, []);
  const escaped = query.$or[0].title.$regex;
  assert.equal(new RegExp(escaped, 'i').test('C++ [new]'), true);
  assert.equal(new RegExp(escaped, 'i').test('Cxx new'), false);
});

test('search input is bounded before becoming a database expression', async (t) => {
  let query;
  t.mock.method(Product, 'find', async (filter) => {
    query = filter;
    return [];
  });
  await getProducts({ query: { keyword: 'a'.repeat(150) } }, {
    json() { return this; }, status() { return this; },
  });
  assert.equal(query.$or[0].title.$regex.length, 80);
});

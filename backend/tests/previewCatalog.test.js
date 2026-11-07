const test = require('node:test');
const assert = require('node:assert/strict');
const { getPreviewProduct, getPreviewProducts } = require('../lib/previewCatalog');

test('preview catalog has stable identifiers and is not purchasable', () => {
  const products = getPreviewProducts();
  assert.ok(products.length >= 6);
  for (const product of products) {
    assert.match(product._id, /^[a-f0-9]{24}$/i);
    assert.equal(product.stock, 0);
    assert.equal(product.isPreview, true);
    assert.equal(getPreviewProduct(product._id)._id, product._id);
  }
});
test('preview search filters correctly and never treats user text as regex', () => {
  assert.ok(getPreviewProducts({ keyword: 'headphones' }).some(p => p.title.includes('Headphones')));
  assert.equal(getPreviewProducts({ keyword: '[.*+]' }).length, 0);
  assert.ok(getPreviewProducts({ featured: 'true' }).every(p => p.featured));
  assert.equal(getPreviewProduct('d0000000000000000000000'), null);
});

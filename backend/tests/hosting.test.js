const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

test('no-database hosted preview serves status and product catalog without enabling checkout', async () => {
  const previousMongo = process.env.MONGO_URI;
  const previousSecret = process.env.JWT_SECRET;
  delete process.env.MONGO_URI;
  delete process.env.JWT_SECRET;
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const healthRes = await fetch(origin + '/api/health');
    const health = await healthRes.json();
    assert.equal(healthRes.status, 200);
    assert.equal(health.status, 'setup_required');
    assert.equal(health.demoCatalog, true);
    assert.equal(health.payments, 'demo_only');

    const productRes = await fetch(origin + '/api/products');
    const products = await productRes.json();
    assert.equal(productRes.status, 200);
    assert.ok(products.length >= 6);
    const itemRes = await fetch(origin + '/api/products/' + products[0]._id);
    const item = await itemRes.json();
    assert.equal(item.title, products[0].title);
    assert.equal(item.stock, 0);

    const loginRes = await fetch(origin + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'example@example.test', password: 'not-real' }),
    });
    const login = await loginRes.json();
    assert.equal(loginRes.status, 503);
    assert.equal(login.code, 'SETUP_REQUIRED');
    assert.equal((await fetch(origin + '/api/cart')).status, 503);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousMongo === undefined) delete process.env.MONGO_URI;
    else process.env.MONGO_URI = previousMongo;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

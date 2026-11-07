// Order totals are calculated using catalog prices, never client-supplied totals.
const TAX_RATE_PERCENT = 10; // Demo storefront tax estimate, not tax advice.
const MAX_CART_LINES = 30;
const MAX_QUANTITY = 20;
const ORDER_STATUSES = Object.freeze(['Processing', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled']);

class CommerceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'CommerceError';
    this.status = status;
  }
}

const dollarsToCents = (price) => {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 ||
      price > 1000000 || Math.abs(Math.round(price * 100) / 100 - price) > 0.000001) {
    throw new CommerceError('A catalog item has an invalid price.', 409);
  }
  return Math.round(price * 100);
};

function validateShippingAddress(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new CommerceError('A shipping address is required.');
  }
  const limits = { address: 200, city: 100, postalCode: 30, country: 100 };
  const result = {};
  for (const [key, max] of Object.entries(limits)) {
    if (typeof raw[key] !== 'string') throw new CommerceError('Please complete the shipping address.');
    const value = raw[key].trim();
    if (!value || value.length > max) throw new CommerceError('Please provide a valid ' + key + '.');
    result[key] = value;
  }
  return result;
}

function validateCartLines(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > MAX_CART_LINES) {
    throw new CommerceError('Your cart must contain 1–30 products.');
  }
  const seen = new Set();
  return lines.map((line) => {
    const productId = String(line?.productId || '');
    const quantity = line?.quantity;
    if (!/^[a-f0-9]{24}$/i.test(productId) || !Number.isInteger(quantity) ||
        quantity < 1 || quantity > MAX_QUANTITY || seen.has(productId)) {
      throw new CommerceError('Your cart contains an invalid or duplicate item.');
    }
    seen.add(productId);
    return { productId, quantity };
  });
}

function priceOrder(lines, catalog) {
  const priced = lines.map(({ productId, quantity }) => {
    const product = catalog.get(productId);
    if (!product) throw new CommerceError('A cart product is no longer available.', 409);
    if (!Number.isInteger(product.stock) || product.stock < quantity) {
      throw new CommerceError('Insufficient stock for ' + String(product.title || 'an item').slice(0, 80) + '.', 409);
    }
    const cents = dollarsToCents(product.price);
    return { productId, quantity, price: cents / 100, lineCents: cents * quantity };
  });
  const subtotalCents = priced.reduce((sum, item) => sum + item.lineCents, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE_PERCENT / 100);
  const totalCents = subtotalCents + taxCents;
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new CommerceError('The cart total is invalid.', 409);
  }
  return {
    products: priced.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    totalPrice: totalCents / 100,
  };
}

function validateStatusTransition(current, next) {
  if (!ORDER_STATUSES.includes(next)) throw new CommerceError('Unsupported order status.');
  if (current === next) return;
  if (['Delivered', 'Cancelled'].includes(current)) throw new CommerceError('Completed orders cannot change status.', 409);
  if (next === 'Cancelled') return;
  const before = ORDER_STATUSES.indexOf(current);
  const after = ORDER_STATUSES.indexOf(next);
  if (before < 0 || after < before || after > before + 1) {
    throw new CommerceError('Move the order to the next fulfillment status.', 409);
  }
}

module.exports = {
  CommerceError, MAX_QUANTITY, TAX_RATE_PERCENT, ORDER_STATUSES,
  validateShippingAddress, validateCartLines, priceOrder, validateStatusTransition,
};

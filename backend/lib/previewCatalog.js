// Static demonstration catalog for deployments without a connected database.
// Never use this module for orders, accounts, inventory or payment processing.
const examples = [
  { title: 'MacBook Air', category: 'Electronics', brand: 'Apple', price: 1099, originalPrice: 1199, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800', description: 'Example laptop listing for the SwiftCart portfolio preview.', featured: true, bestseller: true },
  { title: 'Wireless Headphones', category: 'Electronics', brand: 'Sony', price: 348, originalPrice: 399, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800', description: 'Example audio product listing for the SwiftCart portfolio preview.', featured: true, bestseller: false },
  { title: 'Running Shoes', category: 'Fashion', brand: 'Nike', price: 160, originalPrice: null, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800', description: 'Example footwear listing for the SwiftCart portfolio preview.', featured: false, bestseller: true },
  { title: 'Denim Jeans', category: 'Fashion', brand: 'Levi’s', price: 79, originalPrice: null, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800', description: 'Example fashion listing for the SwiftCart portfolio preview.', featured: true, bestseller: false },
  { title: 'Coffee Maker', category: 'Home & Living', brand: 'Nespresso', price: 199, originalPrice: null, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=800', description: 'Example home appliance listing for the SwiftCart portfolio preview.', featured: false, bestseller: true },
  { title: 'Desk Chair', category: 'Home & Living', brand: 'Herman Miller', price: 1250, originalPrice: null, image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=800', description: 'Example furniture listing for the SwiftCart portfolio preview.', featured: true, bestseller: false },
  { title: 'Fitness Watch', category: 'Electronics', brand: 'Garmin', price: 899, originalPrice: null, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', description: 'Example wearable listing for the SwiftCart portfolio preview.', featured: false, bestseller: true },
  { title: 'Wireless Keyboard', category: 'Electronics', brand: 'Keychron', price: 199, originalPrice: null, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800', description: 'Example accessory listing for the SwiftCart portfolio preview.', featured: true, bestseller: false },
].map((item, index) => ({
  ...item,
  _id: 'd000000000000000000000' + String(index + 1),
  stock: 0,
  rating: 0,
  isPreview: true,
}));

function getPreviewProducts(query = {}) {
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim().slice(0, 80).toLowerCase() : '';
  return examples.filter((p) => {
    if (keyword && ![p.title, p.brand, p.description, p.category].some((value) => value.toLowerCase().includes(keyword))) return false;
    if (query.category && query.category !== p.category) return false;
    if (query.featured === 'true' && !p.featured) return false;
    if (query.bestseller === 'true' && !p.bestseller) return false;
    return true;
  });
}

function getPreviewProduct(id) {
  return examples.find((product) => product._id === id) || null;
}

module.exports = { getPreviewProducts, getPreviewProduct };

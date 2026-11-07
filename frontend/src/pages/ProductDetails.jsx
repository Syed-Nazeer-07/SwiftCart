import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { ShoppingBag, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useContext(CartContext);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        setActiveImage(data.image);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const ok = await addToCart(product._id, quantity);
    if (ok) {
      const { default: toast } = await import('react-hot-toast');
      toast.success('Added to cart');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="relative w-12 h-12 sm:w-20 sm:h-20">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-dark border-t-transparent animate-spin"></div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center mt-32 min-h-[50vh] px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-4">Product Not Found</h2>
      <button onClick={() => navigate(-1)} className="text-dark hover:underline flex items-center justify-center mx-auto font-medium">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </button>
    </div>
  );

  const rating = Number(product.rating) > 0 ? Number(product.rating).toFixed(1) : null;
  // Mock thumbnails
  const thumbnails = [product.image, product.image, product.image, product.image];

  return (
    <div className="bg-white min-h-screen pt-4 sm:pt-10 lg:pt-24 pb-8 sm:pb-16">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl mt-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center text-sm text-slate-500">
            <Link to="/" className="hover:text-dark transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to={`/?category=${product.category}`} className="hover:text-dark transition-colors capitalize">{product.category}</Link>
            <span className="mx-2">/</span>
            <span className="text-dark font-medium truncate max-w-[150px] sm:max-w-xs">{product.title}</span>
          </div>
          <button aria-label="Back to products" onClick={() => navigate(-1)} className="flex items-center text-dark font-semibold text-sm hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
        </div>
        
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            {/* Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-1/2 p-4 sm:p-8 lg:p-12 flex flex-col sm:flex-row gap-6 bg-slate-50"
            >
              {/* Thumbnails (desktop) */}
              <div className="hidden sm:flex flex-col gap-4 w-20 flex-shrink-0">
                {thumbnails.map((thumb, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(thumb)}
                    className={`w-20 h-24 bg-white border-2 overflow-hidden ${activeImage === thumb ? 'border-dark' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={thumb} alt="Thumbnail" className="w-full h-full object-contain p-1" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=600'; }} />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div className="relative w-full aspect-[3/4] bg-white group overflow-hidden border border-slate-100 flex-grow">
                <img 
                  src={activeImage} 
                  alt={product.title} 
                  loading="eager"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=600'; }}
                  className="w-full h-full object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-125 cursor-zoom-in" 
                />
                <button 
                  aria-label="Add to Wishlist"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 transition-colors z-10"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              {/* Thumbnails (mobile) */}
              <div className="flex sm:hidden gap-3 overflow-x-auto pb-2">
                {thumbnails.map((thumb, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(thumb)}
                    className={`w-16 h-20 bg-white border-2 flex-shrink-0 ${activeImage === thumb ? 'border-dark' : 'border-transparent opacity-60'}`}
                  >
                    <img src={thumb} alt="Thumbnail" className="w-full h-full object-contain p-1" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=600'; }} />
                  </button>
                ))}
              </div>
            </motion.div>
            
            {/* Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-1/2 p-5 sm:p-8 lg:p-12 flex flex-col"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-dark text-dark' : 'text-slate-300'}`} />
                  ))}
                  <span className="font-semibold text-dark ml-2 mr-1">{rating}</span>
                  <span className="text-slate-500 underline cursor-pointer hover:text-dark">({reviewCount} reviews)</span>
                </div>
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-bold text-dark mb-4 leading-tight tracking-tight">
                {product.title}
              </h1>
              
              <div className="flex flex-wrap items-end gap-3 sm:gap-4 mb-6">
                <p className="text-3xl sm:text-4xl text-dark font-bold">${product.price.toFixed(2)}</p>
                {(product.originalPrice && product.originalPrice > product.price) ? (
                  <p className="text-lg text-slate-400 line-through mb-1">${product.originalPrice.toFixed(2)}</p>
                ) : (
                  <p className="text-lg text-slate-400 line-through mb-1">${(product.price * 1.25).toFixed(2)}</p>
                )}
              </div>

              <div className="text-sm text-slate-500 mb-8 space-y-1">
                {product.brand && <p><span className="font-semibold text-dark">Brand:</span> {product.brand}</p>}
                <p><span className="font-semibold text-dark">SKU:</span> {product._id.substring(0, 8).toUpperCase()}</p>
                <p><span className="font-semibold text-dark">Category:</span> <span className="capitalize">{product.category}</span></p>
                <p className="text-green-600 font-semibold">{product.stock > 0 ? 'In Stock - Ready to Ship' : 'Out of Stock'}</p>
              </div>
              
              <div className="prose prose-slate text-slate-600 mb-10 text-sm sm:text-base leading-relaxed">
                <p>{product.description}</p>
              </div>
              
              <div className="mt-auto pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                  {product.stock > 0 ? (
                    <>
                      <div className="flex items-center border border-slate-300 bg-white rounded-full h-14 w-full sm:w-36 flex-shrink-0">
                        <button 
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="px-5 h-full rounded-l-full text-slate-500 hover:bg-slate-50 hover:text-dark font-medium text-lg transition-colors"
                        >-</button>
                        <input 
                          type="number" 
                          aria-label="Quantity"
                          value={quantity} 
                          readOnly 
                          className="flex-1 w-full text-center font-bold text-dark bg-transparent focus:outline-none"
                        />
                        <button 
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(q => Math.min(product.stock, 20, q + 1))}
                          className="px-5 h-full rounded-r-full text-slate-500 hover:bg-slate-50 hover:text-dark font-medium text-lg transition-colors"
                        >+</button>
                      </div>
                      
                      <button 
                        aria-label="Add to cart"
                        onClick={handleAddToCart}
                        className="w-full bg-dark text-white h-14 rounded-full hover:bg-black transition-colors shadow-md flex items-center justify-center font-bold tracking-widest uppercase text-sm"
                      >
                        <ShoppingBag className="w-5 h-5 mr-3" />
                        Add to Cart
                      </button>
                    </>
                  ) : (
                    <div className="w-full bg-slate-100 text-slate-500 h-14 flex items-center justify-center font-bold tracking-widest uppercase text-sm cursor-not-allowed">
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-8">
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 mr-3 text-dark flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-dark">Free Shipping</p>
                      <p className="text-xs">On orders over $150</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <RefreshCw className="w-5 h-5 mr-3 text-dark flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-dark">Easy Returns</p>
                      <p className="text-xs">30-day return policy</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ShieldCheck className="w-5 h-5 mr-3 text-dark flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-dark">Secure Payment</p>
                      <p className="text-xs">256-bit SSL encryption</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-3 text-dark flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-dark">Premium Quality</p>
                      <p className="text-xs">Guaranteed authentic</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

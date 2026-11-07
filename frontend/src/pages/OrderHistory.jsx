import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Package, Search, ArrowRight, X, ChevronRight, MapPin, Calendar, Clock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/orders/myorders');
        // Sort newest first
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedData);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Packed': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Out For Delivery': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDeliveryText = (order) => {
    if (order.status === 'Delivered') {
      return `Delivered on ${new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (order.status === 'Cancelled') {
      return 'Order Cancelled';
    }
    
    // Calculate expected delivery (e.g. 4 days from creation)
    const expected = new Date(order.createdAt);
    expected.setDate(expected.getDate() + 4);
    
    const today = new Date();
    if (expected.toDateString() === today.toDateString()) {
      return 'Arriving Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (expected.toDateString() === tomorrow.toDateString()) {
      return 'Arriving Tomorrow';
    }

    return `Expected Delivery: ${expected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const statusFlow = ['Processing', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'];
  
  const getProgressPercentage = (status) => {
    if (status === 'Cancelled') return 0;
    const index = statusFlow.indexOf(status);
    if (index === -1) return 0;
    return (index / (statusFlow.length - 1)) * 100;
  };

  const filteredOrders = orders.filter(order => {
    // Filter
    if (filter === 'Processing' && !['Processing', 'Packed', 'Shipped', 'Out For Delivery'].includes(order.status)) return false;
    if (filter === 'Delivered' && order.status !== 'Delivered') return false;
    if (filter === 'Cancelled' && order.status !== 'Cancelled') return false;
    
    // Search by ID or Product Name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchId = order._id.toLowerCase().includes(query);
      const matchProduct = order.products.some(p => p.productId?.title.toLowerCase().includes(query));
      if (!matchId && !matchProduct) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8 mb-20">
      <button aria-label="Back" onClick={() => navigate(-1)} className="flex items-center text-dark font-semibold text-sm hover:underline mb-6">
        <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Account
      </button>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark mb-2">Order History</h1>
          <p className="text-slate-500 text-sm">Check the status of recent orders, manage returns, and discover similar products.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Processing', 'Delivered', 'Cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-dark text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search all orders..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-dark focus:ring-1 focus:ring-dark text-sm transition-all text-dark"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-2 border-dark border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl py-24 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-dark mb-3">No orders yet</h2>
          <p className="text-slate-500 mb-8 max-w-sm">When you place an order, it will appear here so you can track its status.</p>
          <Link to="/" className="bg-dark text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-colors shadow-sm">
            Start Shopping
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No orders found matching your search.</div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-slate-500 font-medium mb-1">Order Placed</p>
                    <p className="font-semibold text-dark">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium mb-1">Total Amount</p>
                    <p className="font-semibold text-dark">${order.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-slate-500 font-medium mb-1">Order #</p>
                    <p className="font-semibold text-dark">SWC-{order._id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="w-full sm:w-auto flex items-center justify-center sm:justify-start text-dark font-semibold text-sm hover:underline"
                >
                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-lg font-bold text-dark">{getDeliveryText(order)}</h3>
                  <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-6 divide-y divide-slate-50">
                  {order.products.map(item => (
                      <div key={item._id || item.productId?._id} className="pt-6 first:pt-0 flex flex-col sm:flex-row items-start gap-6">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center p-3 border border-slate-100">
                          {(item.image || item.productId?.image) ? <img src={item.image || item.productId?.image} alt={item.title || item.productId?.title || 'Product'} className="w-full h-full object-contain" /> : <Package className="w-8 h-8 text-slate-300" />}
                        </div>
                        <div className="flex-grow">
                          {item.productId?._id ? (
                            <Link to={`/product/${item.productId._id}`} className="text-base sm:text-lg font-bold text-dark hover:underline line-clamp-2 mb-1">
                              {item.title || item.productId.title}
                            </Link>
                          ) : (
                            <p className="text-base sm:text-lg font-bold text-dark mb-1">{item.title || 'Removed product'}</p>
                          )}
                          {(item.brand || item.productId?.brand) && <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">{item.brand || item.productId?.brand}</p>}
                          <div className="flex items-center text-sm text-slate-600 mb-1">
                            <span className="font-medium mr-2">Qty:</span> {item.quantity}
                          </div>
                          <div className="flex items-center text-sm text-slate-600">
                            <span className="font-medium mr-2">Price:</span> ${item.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="hidden sm:block text-right">
                          {item.productId?._id && <Link to={`/product/${item.productId._id}`} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-dark px-5 py-2.5 rounded-full text-sm font-semibold transition-colors block text-center mb-2">
                            View product
                          </Link>}
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-dark">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {/* Status Tracker */}
                <div>
                  <h3 className="font-bold text-dark mb-4 text-sm uppercase tracking-wider">Tracking</h3>
                  {selectedOrder.status === 'Cancelled' ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100 flex items-center">
                      <X className="w-5 h-5 mr-2" /> Order Cancelled
                    </div>
                  ) : (
                    <div className="relative pt-2">
                      <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-dark rounded-full transition-all duration-1000"
                          style={{ width: `${getProgressPercentage(selectedOrder.status)}%` }}
                        />
                      </div>
                      <div className="relative flex justify-between">
                        {statusFlow.map((status, i) => {
                          const isCompleted = statusFlow.indexOf(selectedOrder.status) >= i;
                          const isCurrent = selectedOrder.status === status;
                          return (
                            <div key={status} className="flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full mt-[-2px] border-4 border-white ${isCompleted ? 'bg-dark' : 'bg-slate-200'} ${isCurrent ? 'ring-4 ring-slate-100' : ''} z-10`} />
                              <span className={`text-[10px] sm:text-xs font-semibold mt-2 text-center max-w-[60px] ${isCompleted ? 'text-dark' : 'text-slate-400'}`}>{status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Details */}
                <div>
                  <h3 className="font-bold text-dark mb-4 text-sm uppercase tracking-wider flex items-center">
                    <MapPin className="w-4 h-4 mr-2" /> Shipping Address
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700">
                    <p className="font-semibold text-dark mb-1">Standard Shipping</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-bold text-dark mb-4 text-sm uppercase tracking-wider flex items-center">
                    <Package className="w-4 h-4 mr-2" /> Items Ordered
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.products.map(item => (
                      <div key={item._id || item.productId?._id} className="flex items-center gap-4 bg-white border border-slate-100 p-3 rounded-xl">
                        {(item.image || item.productId?.image) ? <img src={item.image || item.productId?.image} alt={item.title || item.productId?.title || 'Product'} className="w-16 h-16 object-contain bg-slate-50 rounded-lg p-1" /> : <Package className="w-8 h-8 text-slate-300" />}
                        <div className="flex-grow">
                          <p className="font-bold text-dark text-sm line-clamp-1">{item.title || item.productId?.title || 'Removed product'}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="font-bold text-dark text-sm">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Summary */}
                <div>
                  <h3 className="font-bold text-dark mb-4 text-sm uppercase tracking-wider flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" /> Order Summary
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.subtotal ?? selectedOrder.totalPrice / 1.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${(selectedOrder.tax ?? selectedOrder.totalPrice - selectedOrder.totalPrice / 1.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-dark pt-2 border-t border-slate-200 mt-2 text-base">
                      <span>Total</span>
                      <span>${selectedOrder.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderHistory;

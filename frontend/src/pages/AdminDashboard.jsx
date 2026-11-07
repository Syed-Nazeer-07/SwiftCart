import { useState, useEffect } from 'react';
import api from '../api/axios';

const ORDER_FLOW = ['Processing', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'];
const allowedStatuses = (current) => {
  const index = ORDER_FLOW.indexOf(current);
  if (index === -1 || current === 'Delivered') return [current];
  return [
    current,
    ...(index + 1 < ORDER_FLOW.length ? [ORDER_FLOW[index + 1]] : []),
    ...(['Processing', 'Packed'].includes(current) ? ['Cancelled'] : []),
  ];
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Product form state
  const [newProduct, setNewProduct] = useState({
    title: '', description: '', price: '', image: '', category: '', stock: ''
  });

  const fetchData = async () => {
    try {
      const pRes = await api.get('/products');
      setProducts(pRes.data);
      
      const oRes = await api.get('/orders');
      setOrders(oRes.data);
      
      const uRes = await api.get('/auth/users');
      setUsers(uRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', newProduct);
      alert('Product created');
      setNewProduct({title: '', description: '', price: '', image: '', category: '', stock: ''});
      fetchData();
    } catch (error) {
      alert('Error creating product');
    }
  };

  const deleteProduct = async (id) => {
    if(window.confirm('Are you sure?')) {
      await api.delete(`/products/${id}`);
      fetchData();
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Could not change order status.');
      await fetchData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8 mb-16">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 md:p-10 min-h-[70vh]">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-dark">Admin Dashboard</h1>
      
      <div className="flex border-b mb-6">
        {['products', 'orders', 'users'].map(tab => (
          <button 
            key={tab}
            className={`px-6 py-2 capitalize font-semibold ${activeTab === tab ? 'border-b-2 border-dark text-dark' : 'text-slate-500'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Add New Product</h2>
          <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-lg">
            <input required placeholder="Title" value={newProduct.title} onChange={e=>setNewProduct({...newProduct, title: e.target.value})} className="p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-dark focus:ring-2 focus:ring-dark/20 transition-all text-sm" />
            <input required placeholder="Category" value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})} className="p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-dark focus:ring-2 focus:ring-dark/20 transition-all text-sm" />
            <input required type="number" placeholder="Price" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} className="p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-dark focus:ring-2 focus:ring-dark/20 transition-all text-sm" />
            <input required type="number" placeholder="Stock" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock: e.target.value})} className="p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-dark focus:ring-2 focus:ring-dark/20 transition-all text-sm" />
            <input required placeholder="Image URL" value={newProduct.image} onChange={e=>setNewProduct({...newProduct, image: e.target.value})} className="p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-dark focus:ring-2 focus:ring-dark/20 transition-all text-sm md:col-span-2" />
            <textarea required placeholder="Description" value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description: e.target.value})} className="p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-dark focus:ring-2 focus:ring-dark/20 transition-all text-sm md:col-span-2"></textarea>
            <button type="submit" className="bg-dark text-white py-3 rounded-full md:col-span-2 font-bold hover:bg-black transition-colors shadow-sm">Add Product</button>
          </form>

          <h2 className="text-xl font-bold mb-4">Manage Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {products.map(p => (
                  <tr key={p._id}>
                    <td className="px-6 py-4">{p.title}</td>
                    <td className="px-6 py-4">${p.price}</td>
                    <td className="px-6 py-4">{p.stock}</td>
                    <td className="px-6 py-4">
                      <button onClick={()=>deleteProduct(p._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Manage Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Change Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="px-6 py-4">{o.userId?.name} ({o.userId?.email})</td>
                    <td className="px-6 py-4">${o.totalPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{o.status}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={o.status}
                        disabled={['Delivered', 'Cancelled'].includes(o.status)}
                        onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                        className="border border-slate-200 p-2 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dark/20"
                      >
                        {allowedStatuses(o.status).map((status) => (
                          <option value={status} key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Registered Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 font-bold">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;

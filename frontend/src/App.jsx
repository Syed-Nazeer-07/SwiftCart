import { Suspense, lazy, useEffect, useState } from 'react';
import api from './api/axios';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { Toaster } from 'react-hot-toast';

// Lazy loaded pages for performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>
  </div>
);

function App() {
  const [service, setService] = useState(null);
  useEffect(() => {
    let active = true;
    api.get('/health', { timeout: 8000 })
      .then(({ data }) => { if (active) setService(data.status === 'setup_required' ? 'preview' : 'available'); })
      .catch(() => { if (active) setService('unavailable'); });
    return () => { active = false; };
  }, []);
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white selection:bg-primary selection:text-white">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', color: '#fff' } }} />
      <Navbar />
      {service === 'preview' && (
        <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-900">
          Portfolio preview — example products only. Sign-in, cart and checkout will be available after database setup. No payments are collected.
        </div>
      )}
      {service === 'unavailable' && (
        <div role="status" className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs font-medium text-rose-900">
          The store API is temporarily unavailable. Product and account actions may not work.
        </div>
      )}
      <main className="flex-grow pt-24 pb-12 w-full mx-auto max-w-[1920px]">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            
            {/* Protected Routes */}
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;

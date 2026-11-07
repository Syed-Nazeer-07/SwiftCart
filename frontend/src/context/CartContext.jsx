import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const CartContext = createContext();

const describeError = (error) => error.response?.data?.message || 'Could not update your cart. Please retry.';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ products: [] });
  const [cartLoading, setCartLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchCart = async () => {
    if (!user) {
      setCart({ products: [] });
      setCartLoading(false);
      return;
    }
    setCartLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch (error) {
      console.error('Cart loading failed:', error);
      toast.error('Could not refresh your cart.');
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!user) {
      setCart({ products: [] });
      setCartLoading(false);
      return;
    }
    setCartLoading(true);
    api.get('/cart')
      .then(({ data }) => { if (active) setCart(data); })
      .catch(() => { if (active) toast.error('Could not load your cart.'); })
      .finally(() => { if (active) setCartLoading(false); });
    return () => { active = false; };
  }, [user?._id]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to your cart.');
      return false;
    }
    try {
      const { data } = await api.post('/cart/add', { productId, quantity });
      setCart(data);
      return true;
    } catch (error) {
      toast.error(describeError(error));
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/remove/${productId}`);
      setCart(data);
      return true;
    } catch (error) {
      toast.error(describeError(error));
      return false;
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    try {
      const { data } = await api.put(`/cart/update/${productId}`, { quantity });
      setCart(data);
      return true;
    } catch (error) {
      toast.error(describeError(error));
      return false;
    }
  };

  return (
    <CartContext.Provider value={{
      cart, cartLoading, addToCart, removeFromCart, updateCartQuantity, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

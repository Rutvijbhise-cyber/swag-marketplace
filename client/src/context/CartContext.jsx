import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      setItemCount(0);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get('/cart');
      setItems(data.items);
      setTotal(data.total);
      setItemCount(data.itemCount);
    } catch (err) {
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (itemId, quantity = 1) => {
    try {
      await api.post('/cart/items', { itemId, quantity });
      await fetchCart();
      return true;
    } catch (err) {
      console.error('Add to cart error:', err);
      throw err;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      if (quantity === 0) {
        await api.delete(`/cart/items/${cartItemId}`);
      } else {
        await api.patch(`/cart/items/${cartItemId}`, { quantity });
      }
      await fetchCart();
    } catch (err) {
      console.error('Update quantity error:', err);
      throw err;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/items/${cartItemId}`);
      await fetchCart();
    } catch (err) {
      console.error('Remove from cart error:', err);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setItems([]);
      setTotal(0);
      setItemCount(0);
    } catch (err) {
      console.error('Clear cart error:', err);
      throw err;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

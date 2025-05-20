import React, { createContext, useState, useContext, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 從本地存儲加載購物車數據
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // 保存購物車數據到本地存儲
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // 處理 Snackbar 關閉
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 添加商品到購物車
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const itemExists = prevItems.some(item => item.id === product.id);
      // 取第一張圖當封面
      const imageUrl = product.imageUrl || (product.images?.[0] ?? '');
  
      if (itemExists) {
        setSnackbar({
          open: true,
          message: '此商品已在購物車，請勿重複點選!',
          severity: 'warning'
        });
        return prevItems;          // 不做任何變更
      }
  
      // 只有在商品不存在時才顯示成功提示
      setSnackbar({
        open: true,
        message: '商品已成功加入購物車！',
        severity: 'success'
      });
      return [...prevItems, { ...product, imageUrl, quantity: 1 }];
    });
  };
  

  

  // 從購物車移除商品
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // 更新購物車商品數量
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === productId 
          ? { ...item, quantity: quantity } 
          : item
      )
    );
  };

  // 清空購物車
  const clearCart = () => {
    setCartItems([]);
  };

  // 計算購物車總數量
  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // 計算購物車總價
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      // 如果是贈送商品，不計入總價
      if (item.isGiveaway) return total;
      return total + (item.price * item.quantity);
    }, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 96, sm: 72, md: 135 } }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </CartContext.Provider>
  );
} 
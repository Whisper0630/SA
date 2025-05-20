import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  
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

  // 添加商品到購物車
  const addToCart = (product) => {
    setCartItems(prevItems => {
      // 檢查商品是否已在購物車中
      const itemExists = prevItems.find(item => item.id === product.id);
      
      if (itemExists) {
        // 如果已存在，增加數量
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // 如果不存在，添加新商品
        return [...prevItems, { ...product, quantity: 1 }];
      }
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
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    </CartContext.Provider>
  );
} 
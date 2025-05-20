import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserOrders, getSellerOrders, createOrder, updateOrderStatus, getOrderById } from '../services/orderService';

const OrderContext = createContext();

export function useOrder() {
  return useContext(OrderContext);
}

export function OrderProvider({ children }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 獲取用戶的訂單
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const unsubscribe = getUserOrders((orders) => {
      setOrders(orders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 獲取賣家的訂單
  useEffect(() => {
    if (!currentUser) {
      setSellerOrders([]);
      return;
    }

    const unsubscribe = getSellerOrders((orders) => {
      setSellerOrders(orders);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 創建新訂單
  const createNewOrder = async (orderData) => {
    try {
      setError('');
      const order = await createOrder(orderData);
      return order;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // 更新訂單狀態
  const updateOrder = async (orderId, status, rejectionReason = '') => {
    try {
      setError('');
      const order = await updateOrderStatus(orderId, status, rejectionReason);
      return order;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // 獲取訂單詳情
  const getOrder = async (orderId) => {
    try {
      setError('');
      const order = await getOrderById(orderId);
      return order;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    orders,
    sellerOrders,
    loading,
    error,
    createNewOrder,
    updateOrder,
    getOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
} 
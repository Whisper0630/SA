import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';

const AddProduct = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 處理表單提交
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      if (!currentUser) {
        throw new Error('請先登入');
      }
      
      // 直接將產品數據與圖片一起保存到Firestore
      const productData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || '未知用戶',
      };
      
      await addDoc(collection(db, 'products'), productData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/my-products');
      }, 2000);
    } catch (err) {
      setError(err.message);
      console.error('添加產品錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">新增商品</h2>
      
      <ProductForm 
        onSubmit={handleSubmit}
        isLoading={loading}
        error={error}
        success={success}
        mode="add"
        submitLabel="上架商品"
      />
    </Container>
  );
};

export default AddProduct; 
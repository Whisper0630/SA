import React, { useState, useEffect } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, waitForAuth, getCurrentUserIdToken } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import ProductForm from '../components/ProductForm';

const EditProduct = () => {
  const [productData, setProductData] = useState(null);
  const [originalImages, setOriginalImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  // 載入商品數據
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const product = docSnap.data();
          
          // 確認是否為商品擁有者
          if (product.userId !== currentUser.uid) {
            setError('您沒有權限編輯此商品');
            return;
          }
          
          // 設置表單數據
          setProductData({
            name: product.name || '',
            description: product.description || '',
            price: product.price ? product.price.toString() : '',
            category: product.category || '',
            stock: product.stock ? product.stock.toString() : '',
            location: product.location || '',
          });
          
          // 設置圖片
          if (product.images && product.images.length > 0) {
            setOriginalImages(product.images);
          }
        } else {
          setError('找不到商品資料');
        }
      } catch (err) {
        console.error('獲取商品錯誤:', err);
        setError('載入商品資料時發生錯誤');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProduct();
  }, [id, currentUser, navigate]);

  // 處理表單提交
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // 等待認證狀態初始化
      await waitForAuth();
      
      if (!currentUser) {
        throw new Error('請先登入');
      }
      
      // 獲取最新認證令牌，確保權限
      await getCurrentUserIdToken();
      
      // 更新產品數據
      const updatedData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      // 嘗試更新文檔，處理權限錯誤
      try {
        const productRef = doc(db, 'products', id);
        await updateDoc(productRef, updatedData);
      } catch (updateError) {
        console.error('更新商品時發生錯誤:', updateError);
        
        // 處理權限錯誤
        if (updateError.code === 'permission-denied') {
          throw new Error('權限不足，請確認您有權限編輯此商品。可能需要重新登入或稍後再試。');
        }
        
        throw updateError;
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/product/${id}`);
      }, 2000);
    } catch (err) {
      console.error('更新商品錯誤:', err);
      
      // 自定義錯誤訊息
      const errorMessage = err.code === 'permission-denied' 
        ? '權限不足，請確認您有權限編輯此商品。可能需要重新登入或稍後再試。'
        : err.message || '更新商品時發生錯誤，請稍後再試';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">載入中...</span>
        </Spinner>
      </Container>
    );
  }

  if (error && !success) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <button className="btn btn-primary" onClick={() => navigate('/my-products')}>
          返回我的商品
        </button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">編輯商品</h2>
      
      {productData && (
        <ProductForm 
          initialValues={productData}
          originalImages={originalImages}
          onSubmit={handleSubmit}
          isLoading={loading}
          error={error}
          success={success}
          mode="edit"
          submitLabel="更新商品"
          onCancel={() => navigate(`/product/${id}`)}
        />
      )}
    </Container>
  );
};

export default EditProduct; 
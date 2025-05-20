import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, waitForAuth, getCurrentUserIdToken } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/Delete.css';

const DeleteProduct = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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
          const productData = {
            id: docSnap.id,
            ...docSnap.data()
          };
          
          // 確認是否為商品擁有者
          if (productData.userId !== currentUser.uid) {
            setError('您沒有權限刪除此商品');
            return;
          }
          
          setProduct(productData);
        } else {
          setError('找不到商品資料');
        }
      } catch (err) {
        console.error('獲取商品錯誤:', err);
        setError('載入商品資料時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, currentUser, navigate]);

  // 處理商品刪除
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      // 等待認證狀態初始化
      await waitForAuth();
      
      if (!currentUser) {
        throw new Error('請先登入');
      }
      
      if (!product) {
        throw new Error('找不到商品資料');
      }
      
      // 確認是否為商品擁有者
      if (product.userId !== currentUser.uid) {
        throw new Error('您沒有權限刪除此商品');
      }
      
      // 獲取最新認證令牌，確保權限
      await getCurrentUserIdToken();
      
      // 刪除商品
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (deleteError) {
        console.error('刪除商品時發生錯誤:', deleteError);
        
        // 處理權限錯誤
        if (deleteError.code === 'permission-denied') {
          throw new Error('權限不足，請確認您有權限刪除此商品。可能需要重新登入或稍後再試。');
        }
        
        throw deleteError;
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/my-products');
      }, 2000);
    } catch (err) {
      console.error('刪除商品錯誤:', err);
      
      // 自定義錯誤訊息
      const errorMessage = err.code === 'permission-denied' 
        ? '權限不足，請確認您有權限刪除此商品。可能需要重新登入或稍後再試。'
        : err.message || '刪除商品時發生錯誤，請稍後再試';
      
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
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
        <Button variant="primary" onClick={() => navigate('/my-products')}>
          返回我的商品
        </Button>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="py-5">
        <Alert variant="success">商品已成功刪除！正在跳轉回商品列表...</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">刪除商品</h2>
      
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4} className="text-center">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    objectFit: 'contain' 
                  }}
                />
              ) : (
                <div 
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="text-muted">無圖片</span>
                </div>
              )}
            </Col>
            <Col md={8}>
              <h3>{product.name}</h3>
              <p><strong>價格:</strong> NT$ {product.price}</p>
              <p><strong>類別:</strong> {product.category}</p>
              <p><strong>庫存:</strong> {product.stock}</p>
              <p><strong>位置:</strong> {product.location}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Alert variant="warning">
        <Alert.Heading>確定要刪除此商品嗎？</Alert.Heading>
        <p>此操作無法撤銷。刪除後，此商品將從系統中永久移除。</p>
      </Alert>
      
      <div className="d-flex gap-2">
        <Button 
          variant="danger" 
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">處理中...</span>
            </>
          ) : '確認刪除'}
        </Button>
        
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate(`/product/${id}`)}
          disabled={deleteLoading}
        >
          取消
        </Button>
      </div>
    </Container>
  );
};

export default DeleteProduct; 
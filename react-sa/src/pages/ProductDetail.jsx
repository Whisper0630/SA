import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, Carousel } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import StartChatButton from '../components/StartChatButton';
import '../styles/pages/Product.css';

const ProductDetail = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [sellerData, setSellerData] = useState(null);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const productData = {
            id: docSnap.id,
            ...docSnap.data()
          };
          setProduct(productData);
          
          // 獲取賣家資訊
          if (productData.userId) {
            const sellerRef = doc(db, 'users', productData.userId);
            const sellerSnap = await getDoc(sellerRef);
            if (sellerSnap.exists()) {
              setSellerData(sellerSnap.data());
            }
          }
        } else {
          setError('找不到該商品。');
        }
      } catch (err) {
        console.error('獲取商品詳情錯誤:', err);
        setError('無法載入商品詳情。請稍後再試。');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setSuccessMessage('商品已成功加入購物車！');
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">載入中...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || '無法載入商品。'}</Alert>
        <Button variant="outline-primary" className="returnButton" onClick={() => navigate('/')}>
          返回商品列表
        </Button>
      </Container>
    );
  }

  const isOwner = currentUser && currentUser.uid === product.userId;

  return (
    <Container className="productContainer">
      <Button variant="outline-primary" className="returnButton" onClick={() => navigate('/')}>
        返回商品列表
      </Button>
      
      {successMessage && (
        <Alert variant="success" className="mt-3">
          {successMessage}
        </Alert>
      )}
      
      <Row className="mt-4">
        <Col md={6}>
          <div className="productImageContainer">
            {product.images && product.images.length > 0 ? (
              <Carousel className="productCarousel">
                {product.images.map((image, index) => (
                  <Carousel.Item key={index}>
                    <img
                      className="productDetailImage"
                      src={image}
                      alt={`${product.name} - 圖片 ${index + 1}`}
                    />
                  </Carousel.Item>
                ))}
              </Carousel>
            ) : (
              <div className="productDetailImage d-flex align-items-center justify-content-center">
                <p className="text-muted">無圖片</p>
              </div>
            )}
          </div>
        </Col>
        
        <Col md={6} className="productDetails">
          <h2 className="productTitle">{product.name}</h2>
          
          <div className="productPrice">NT$ {product.price}</div>
          
          <div className="productTags">
            {product.stock > 0 && <span className="stockTag">庫存: {product.stock}</span>}
            {product.category && <span className="categoryTag">{product.category}</span>}
          </div>
          
          <div className="productDescription">
            <h5 className="descriptionTitle">商品描述:</h5>
            <p>{product.description || '無描述'}</p>
          </div>
          
          <div className="actionButtonsContainer">
            {isOwner ? (
              <>
                <Button 
                  variant="warning" 
                  className="editButton" 
                  onClick={() => navigate(`/edit-product/${product.id}`)}
                >
                  編輯商品
                </Button>
                <Button 
                  variant="danger" 
                  className="deleteButton" 
                  onClick={() => navigate(`/delete-product/${product.id}`)}
                >
                  下架商品
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="primary" 
                  className="cartButton" 
                  disabled={product.stock <= 0}
                  onClick={handleAddToCart}
                >
                  {product.stock > 0 ? '加入購物車' : '售罄'}
                </Button>
                {currentUser && product.userId && sellerData && (
                  <StartChatButton 
                    userId={product.userId} 
                    userName={sellerData.displayName || '賣家'}
                    variant="outline-primary"
                    fullWidth={false}
                    showIcon={true}
                  />
                )}
              </>
            )}
          </div>
        </Col>
      </Row>
      
      <hr className="my-4" />
      
      <Row>
        <Col>
          <h4 className="specTitle">詳細規格</h4>
          <table className="specTable">
            <tbody>
              <tr className="specRow">
                <th className="specLabel">商品類別</th>
                <td className="specValue">{product.category}</td>
              </tr>
              <tr className="specRow">
                <th className="specLabel">宿舍位置</th>
                <td className="specValue">{product.location || '無指定位置'}</td>
              </tr>
              <tr className="specRow">
                <th className="specLabel">庫存</th>
                <td className="specValue">{product.stock}</td>
              </tr>
              <tr className="specRow">
                <th className="specLabel">上架日期</th>
                <td className="specValue">
                  {product.createdAt ? 
                    (product.createdAt.toDate ? 
                      new Date(product.createdAt.toDate()).toLocaleDateString('zh-TW') : 
                      new Date(product.createdAt.seconds * 1000).toLocaleDateString('zh-TW')
                    ) : '無資料'
                  }
                </td>
              </tr>
              <tr className="specRow">
                <th className="specLabel">賣家</th>
                <td className="specValue">{sellerData?.displayName || '未知'}</td>
              </tr>
            </tbody>
          </table>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail; 
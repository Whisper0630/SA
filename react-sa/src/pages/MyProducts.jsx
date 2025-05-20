import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, Button, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 確保用戶已登入
    if (!currentUser) {
      setError('請先登入以查看您的商品');
      setLoading(false);
      return;
    }

    const fetchUserProducts = async () => {
      setLoading(true);
      try {
        // 建立查詢：獲取當前用戶上架的商品，移除orderBy
        console.log('正在查詢用戶商品：', currentUser.uid);
        
        const productQuery = query(
          collection(db, 'products'),
          where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(productQuery);
        const productsData = [];
        
        querySnapshot.forEach((doc) => {
          productsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // 在前端進行排序
        productsData.sort((a, b) => {
          // 如果有createdAt字段則使用它排序，否則不排序
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });
        
        console.log(`找到 ${productsData.length} 個用戶上架的商品`);
        if (productsData.length > 0) {
          console.log('第一個商品數據:', productsData[0]);
        }
        
        setProducts(productsData);
      } catch (error) {
        console.error('獲取用戶商品失敗:', error);
        setError('無法載入您的商品，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProducts();
  }, [currentUser]);

  // 如果用戶未登入，顯示提示
  if (!currentUser && !loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          請先登入以查看您的商品
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/login')}
        >
          前往登入
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" component="h2">
          我的商品
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length > 0 ? (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
              <ProductCard product={product} isOwner={true} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8, 
          px: 2,
          border: '1px dashed #ccc',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            您尚未上架任何商品
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            開始出售您不需要的物品，賺取額外收入！
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            component={Link}
            to="/add-product"
          >
            上架新商品
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default MyProducts; 
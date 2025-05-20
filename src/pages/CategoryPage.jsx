import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, query, orderBy, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import { useParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../contexts/AuthContext';

const CategoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { categoryId } = useParams();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) return;
      
      setLoading(true);
      setError('');
      
      try {
        const productQuery = query(
          collection(db, 'products'),
          where('category', '==', categoryId),
          where('stock', '>', 0)
        );
        
        const querySnapshot = await getDocs(productQuery);
        const productsData = [];
        
        // 獲取所有商品
        for (const docSnapshot of querySnapshot.docs) {
          const productData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          
          // 獲取賣家資訊
          if (productData.userId) {
            try {
              const sellerRef = doc(db, 'users', productData.userId);
              const sellerSnap = await getDoc(sellerRef);
              if (sellerSnap.exists()) {
                const sellerData = sellerSnap.data();
                // 將賣家的交易時間添加到商品資訊中
                productData.sellerAvailableTimes = sellerData.availableTimes || null;
              }
            } catch (error) {
              console.error('獲取賣家資訊錯誤:', error);
            }
          }
          
          productsData.push(productData);
        }
        
        // 在前端進行按創建時間排序
        productsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });
        
        setProducts(productsData);
      } catch (error) {
        console.error('獲取商品失敗:', error);
        setError('無法載入商品，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <SearchBar fullWidth />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {categoryId} 商品列表
        </Typography>
        
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
                <ProductCard 
                  product={product}
                  isOwner={currentUser && currentUser.uid === product.userId}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            border: '1px dashed #ccc',
            borderRadius: 2
          }}>
            <Typography variant="body1" color="text.secondary">
              目前沒有 {categoryId} 類別的商品
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default CategoryPage; 
import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
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
    const fetchCategoryProducts = async () => {
      setLoading(true);
      setError('');
      
      try {
        // 首先檢查是否可以獲取任何商品（測試基本連接）
        try {
          const testQuery = query(
            collection(db, 'products'),
            limit(1)
          );
          
          const testSnapshot = await getDocs(testQuery);
          
          if (testSnapshot.size > 0) {
            const testDoc = testSnapshot.docs[0];
          }
        } catch (testError) {
          throw new Error(`無法連接到資料庫: ${testError.message}`);
        }
        
        // 建立查詢：從指定分類中獲取商品
        const productQuery = query(
          collection(db, 'products'),
          where('category', '==', categoryId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(productQuery);
        const productsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          productsData.push({
            id: doc.id,
            ...data
          });
        });
        
        // 如果找不到商品，檢查所有商品的分類
        if (productsData.length === 0) {
          const allProductsQuery = query(
            collection(db, 'products'),
            orderBy('createdAt', 'desc'),
            limit(10) // 限制返回數量以免資料過多
          );
          
          const allSnapshot = await getDocs(allProductsQuery);
        }
        
        setProducts(productsData);
      } catch (error) {
        setError(`無法載入商品: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryProducts();
    }
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
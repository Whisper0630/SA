import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/Home.css';

const Home = ({ currentCategory }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        let productQuery;
        
        if (currentCategory && currentCategory !== 'all') {
          productQuery = query(
            collection(db, 'products'),
            where('category', '==', currentCategory),
            limit(12)
          );
        } else {
          productQuery = query(
            collection(db, 'products'),
            limit(12)
          );
        }
        
        const querySnapshot = await getDocs(productQuery);
        const productsData = [];
        
        querySnapshot.forEach((doc) => {
          productsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
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
  }, [currentCategory]);

  return (
    <Container maxWidth="lg" className="homeContainer">
      <Box sx={{ mb: 2 }}>
        <SearchBar fullWidth />
      </Box>

      <Box sx={{ mb: 2 }}>
        <div className="sectionHeader">
          <Typography variant="h5" component="h2" className="sectionTitle">
            {currentCategory === 'all' || !currentCategory 
              ? '最新商品' 
              : `${currentCategory}商品`}
          </Typography>
        </div>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box className="loadingIndicator">
            <CircularProgress />
          </Box>
        ) : products.length > 0 ? (
          <Grid container spacing={3} className="productsGrid">
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
              目前沒有上架的商品
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Home; 
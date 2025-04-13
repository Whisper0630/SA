import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

const SearchResults = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // 從URL獲取搜索查詢參數
  const searchQuery = new URLSearchParams(location.search).get('q') || '';

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        console.log(`正在搜索: "${searchQuery}"`);
        
        // 獲取所有商品
        const productsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(productsQuery);
        let productsData = [];
        
        querySnapshot.forEach((doc) => {
          productsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // 在本地過濾符合搜索條件的商品
        // 這裡使用本地過濾是因為Firestore不支持全文搜索
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
        
        productsData = productsData.filter(product => {
          const productName = (product.name || '').toLowerCase();
          const productDescription = (product.description || '').toLowerCase();
          const productCategory = (product.category || '').toLowerCase();
          
          // 檢查所有搜索詞是否至少匹配一個字段
          return searchTerms.some(term => 
            productName.includes(term) || 
            productDescription.includes(term) ||
            productCategory.includes(term)
          );
        });
        
        console.log(`找到 ${productsData.length} 個符合搜索條件的商品`);
        setProducts(productsData);
      } catch (err) {
        console.error('搜索商品失敗:', err);
        setError('搜索失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <SearchBar fullWidth />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          "{searchQuery}" 的搜索結果
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
              沒有找到符合 "{searchQuery}" 的商品
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SearchResults; 
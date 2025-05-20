import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import { Container, Grid, Typography, CircularProgress, Box } from '@mui/material';

const Giveaway = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGiveawayProducts = async () => {
      setLoading(true);
      let q;
      if (category) {
        q = query(
          collection(db, 'products'),
          where('isGiveaway', '==', true),
          where('category', '==', category),
          where('stock', '>', 0)
        );
      } else {
        q = query(
          collection(db, 'products'),
          where('isGiveaway', '==', true),
          where('stock', '>', 0)
        );
      }
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setProducts(data);
      setLoading(false);
    };
    fetchGiveawayProducts();
  }, [category]);

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h5" gutterBottom>免費贈送專區</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.length > 0 ? products.map(product => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          )) : (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 4 }}>
              目前沒有免費贈送的商品
            </Typography>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Giveaway;
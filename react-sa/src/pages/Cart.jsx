import React from 'react';
import { Container, Typography, Button, Grid, Paper, Box, IconButton, Divider } from '@mui/material';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import '../styles/pages/Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();

  // 如果購物車是空的
  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" className="cart-container">
        <Typography variant="h4" component="h1" gutterBottom align="center" className="cart-title">
          購物車
        </Typography>
        <Paper elevation={3} className="empty-cart">
          <Typography variant="h6" align="center" className="empty-cart-text">
            您的購物車是空的
          </Typography>
          <Button 
            component={Link} 
            to="/" 
            variant="contained" 
            color="primary" 
            className="continue-shopping-btn"
          >
            繼續購物
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="cart-container">
      <Typography variant="h4" component="h1" gutterBottom align="center" className="cart-title">
        購物車
      </Typography>

      <Grid container spacing={3}>
        {/* 購物車商品列表 */}
        <Grid item xs={12}>
          <Paper elevation={3} className="cart-items">
            {cartItems.map((item) => (
              <Box key={item.id} className="cart-item">
                <Grid container alignItems="center" spacing={2}>
                  {/* 商品圖片 */}
                  <Grid item xs={2}>
                    <img 
                      src={item.imageUrl || 'https://via.placeholder.com/100'} 
                      alt={item.name} 
                      className="cart-item-image" 
                    />
                  </Grid>
                  
                  {/* 商品名稱 */}
                  <Grid item xs={3}>
                    <Typography variant="subtitle1" className="cart-item-name">
                      {item.name}
                    </Typography>
                  </Grid>
                  
                  {/* 商品單價 */}
                  <Grid item xs={2}>
                    <Typography variant="body2" className="cart-item-price">
                      ${item.price}
                    </Typography>
                  </Grid>
                  
                  {/* 數量控制 */}
                  <Grid item xs={3}>
                    <Box className="quantity-control">
                      <IconButton 
                        size="small" 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography className="quantity">{item.quantity}</Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                  
                  {/* 小計 */}
                  <Grid item xs={1}>
                    <Typography variant="body2" className="cart-item-subtotal">
                      ${item.price * item.quantity}
                    </Typography>
                  </Grid>
                  
                  {/* 刪除按鈕 */}
                  <Grid item xs={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => removeFromCart(item.id)}
                      className="delete-btn"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
                <Divider className="item-divider" />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* 操作按鈕 */}
        <Grid item xs={12} className="cart-actions">
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={clearCart}
            className="clear-cart-btn"
          >
            清空購物車
          </Button>
          <Button 
            component={Link} 
            to="/" 
            variant="outlined" 
            color="primary"
            className="continue-shopping-btn"
          >
            繼續購物
          </Button>
        </Grid>

        {/* 購物車摘要 */}
        <Grid item xs={12}>
          <Paper elevation={3} className="cart-summary">
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Typography variant="h6" className="total-title">
                  總計:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="h5" className="total-amount">
                  ${getCartTotal()}
                </Typography>
              </Grid>
            </Grid>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              size="large" 
              className="checkout-btn"
              component={Link}
              to="/checkout"
            >
              結帳
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart; 
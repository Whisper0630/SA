import React, { useState } from 'react';
import { Container, Typography, Button, Grid, Paper, Box, IconButton, Divider, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import '../styles/pages/Cart.css';
import dayjs from 'dayjs';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { createNewOrder } = useOrder();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openTimeDialog, setOpenTimeDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [amPm, setAmPm] = useState('pm');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('');

  const getHourOptions = () => {
    return amPm === 'am'
      ? Array.from({ length: 12 }, (_, i) => String(i).padStart(2, '0')) // 00~11
      : Array.from({ length: 11 }, (_, i) => String(i + 12).padStart(2, '0')); // 12~22
  };
  const getMinuteOptions = () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const getFilteredHourOptions = () => {
    const now = dayjs();
    const isToday = selectedDate.isSame(now, 'day');
    let hours = getHourOptions();
    if (!isToday) return hours;
    // 如果是上午且現在已經超過11點，上午全部不能選
    if (amPm === 'am' && now.hour() >= 12) return [];
    // 如果是下午且現在已經超過22點，下午全部不能選
    if (amPm === 'pm' && now.hour() >= 22) return [];
    // 過濾掉已過的hour
    return hours.filter(h => Number(h) > now.hour() || (Number(h) === now.hour() && now.minute() < 59));
  };
  const getFilteredMinuteOptions = () => {
    const now = dayjs();
    const isToday = selectedDate.isSame(now, 'day');
    const selectedHour = Number(hour);
    if (!isToday) return getMinuteOptions();
    if (selectedHour > now.hour()) return getMinuteOptions();
    if (selectedHour === now.hour()) {
      return getMinuteOptions().filter(m => Number(m) > now.minute());
    }
    return getMinuteOptions();
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      setSnackbar({
        open: true,
        message: '商品已從購物車移除',
        severity: 'info'
      });
    } else {
      updateQuantity(productId, newQuantity);
      setSnackbar({
        open: true,
        message: '商品數量已更新',
        severity: 'success'
      });
    }
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    setSnackbar({
      open: true,
      message: '商品已從購物車移除',
      severity: 'info'
    });
  };

  const handleClearCart = () => {
    clearCart();
    setSnackbar({
      open: true,
      message: '購物車已清空',
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleContinue = () => {
    setOpenTimeDialog(true);
  };

  const handleTimeDialogClose = () => {
    setOpenTimeDialog(false);
  };

  const handleConfirmCheckout = () => {
    setConfirmDialog(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog(false);
  };

  const handleDateChange = (e) => {
    setSelectedDate(dayjs(e.target.value));
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleFinalCheckout = async () => {
    setConfirmDialog(false);
    setOpenTimeDialog(false);
    // 將日期和時間傳給訂單
    await handleCheckout(null, { date: selectedDate.format('YYYY-MM-DD'), time: `${hour}:${minute}` });
  };

  const handleCheckout = async (e, customData) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log('cartItems for checkout:', cartItems);
    
    if (!currentUser) {
      setSnackbar({
        open: true,
        message: '請先登入後再結帳',
        severity: 'error'
      });
      return;
    }

    if (cartItems.length === 0) {
      setSnackbar({
        open: true,
        message: '購物車是空的',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // 為每個商品創建訂單
      for (const item of cartItems) {
        const orderData = {
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          sellerId: item.userId,
          sellerName: item.userName,
          imageUrl: item.imageUrl,
          // 新增交易時間資訊
          ...customData
        };

        await createNewOrder(orderData);
      }

      // 清空購物車
      clearCart();
      
      setOrderSuccess(true);
      setSnackbar({
        open: true,
        message: '訂單已成功創建',
        severity: 'success'
      });

      // 2秒後跳轉到訂單頁面
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '創建訂單時發生錯誤',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 如果購物車是空的
  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" className="cart-container">
        <Typography variant="h4" component="h1" gutterBottom align="center" className="cart-title">
          購物車
        </Typography>
        <Paper elevation={3} className="empty-cart">
          <Box sx={{ mb: 2 }}>
            <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="空購物車" style={{ width: 80, opacity: 0.7 }} />
          </Box>
          <Typography variant="h6" align="center" className="empty-cart-text">
            您的購物車是空的，快去挑選喜歡的商品吧！
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            點擊下方「繼續購物」返回商品列表
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
                  <Grid item xs={12} sm={2}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="cart-item-image"
                        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f0f0f0',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" align="center">
                          無圖片
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  
                  {/* 商品資訊 */}
                  <Grid item xs={12} sm={10}>
                    <Grid container alignItems="center" spacing={2}>
                      {/* 商品名稱 */}
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" className="cart-item-name" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body1" className="cart-item-price" sx={{ color: '#1976d2', fontWeight: 600, fontSize: '1.1rem' }}>
                          {item.isGiveaway ? '免費領取' : `$${item.price}`}
                        </Typography>
                      </Grid>
                      {/* 小計和刪除按鈕 */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="h6" className="cart-item-subtotal" sx={{ color: '#d32f2f', fontWeight: 700, fontSize: '1.2rem' }}>
                            {item.isGiveaway ? '免費' : `$${item.price}`}
                          </Typography>
                          <IconButton 
                            size="large" 
                            onClick={() => handleRemoveItem(item.id)}
                            className="delete-btn"
                            sx={{ color: '#d32f2f', background: '#fff3e0', ml: 2 }}
                          >
                            <DeleteIcon fontSize="medium" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
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
            color="error" 
            onClick={handleClearCart}
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
                <Typography variant="h6" className="total-title" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
                  總計：
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="h4" className="total-amount" sx={{ color: '#1976d2', fontWeight: 900, fontSize: '2rem' }}>
                  {getCartTotal() > 0 ? `$${getCartTotal()}` : '免費'}
                </Typography>
              </Grid>
            </Grid>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              size="large" 
              className="checkout-btn"
              onClick={handleContinue}
              disabled={loading}
              sx={{ mt: 2, fontWeight: 700, fontSize: '1.2rem', borderRadius: '10px' }}
            >
              {loading ? '處理中...' : '繼續'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* 通知訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* 下單成功訊息 */}
      <Snackbar
        open={orderSuccess}
        autoHideDuration={2500}
        onClose={() => setOrderSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setOrderSuccess(false)} severity="success" sx={{ width: '100%' }}>
          下單成功！正在跳轉到訂單頁面...
        </Alert>
      </Snackbar>

      <Dialog open={openTimeDialog} onClose={handleTimeDialogClose}>
        <DialogTitle>選擇交易時間</DialogTitle>
        <DialogContent>
          <TextField
            label="日期"
            type="date"
            value={selectedDate.format('YYYY-MM-DD')}
            onChange={handleDateChange}
            fullWidth
            sx={{ my: 2 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: dayjs().format('YYYY-MM-DD') }}
          />
          <TextField
            label="上午/下午"
            select
            value={amPm}
            onChange={e => {
              setAmPm(e.target.value);
              setHour(e.target.value === 'am' ? '00' : '12');
              setMinute('');
            }}
            fullWidth
            sx={{ my: 2 }}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="am">上午</MenuItem>
            <MenuItem value="pm">下午</MenuItem>
          </TextField>
          <TextField
            label="時"
            select
            value={hour}
            onChange={e => {
              setHour(e.target.value);
              const mins = getFilteredMinuteOptions();
              setMinute(mins.length > 0 ? mins[0] : '');
            }}
            fullWidth
            sx={{ my: 2 }}
            InputLabelProps={{ shrink: true }}
            disabled={getFilteredHourOptions().length === 0}
          >
            {getFilteredHourOptions().map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="分"
            select
            value={hour && getFilteredHourOptions().length > 0 ? minute : ''}
            onChange={e => setMinute(e.target.value)}
            fullWidth
            sx={{ my: 2 }}
            InputLabelProps={{ shrink: true }}
            disabled={!hour || getFilteredHourOptions().length === 0}
          >
            {hour && getFilteredHourOptions().length > 0 && getFilteredMinuteOptions().map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTimeDialogClose}>取消</Button>
          <Button onClick={handleConfirmCheckout} variant="contained" color="primary">結帳</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmDialog} onClose={handleConfirmDialogClose}>
        <DialogTitle>確認交易時間</DialogTitle>
        <DialogContent>
          <Typography>您選擇的交易時間是：{selectedDate.format('YYYY-MM-DD')} {hour}:{minute}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>取消</Button>
          <Button onClick={handleFinalCheckout} variant="contained" color="primary">確認</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cart; 
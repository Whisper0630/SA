import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardActionArea, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components/ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  const handleClick = () => {
    if (currentUser) {
      // 已登入，直接導航到產品詳情頁
      navigate(`/product/${product.id}`);
    } else {
      // 未登入，顯示登入提示對話框
      setLoginDialogOpen(true);
    }
  };
  
  const handleLoginDialogClose = () => {
    setLoginDialogOpen(false);
  };
  
  const goToLogin = () => {
    setLoginDialogOpen(false);
    navigate('/login');
  };
  
  // 格式化時間戳
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // 處理不同類型的時間戳
      if (timestamp.toDate) {
        // Firestore Timestamp 對象
        return timestamp.toDate().toLocaleDateString('zh-TW');
      } else if (timestamp.seconds) {
        // Timestamp 被轉換為帶 seconds 的對象
        return new Date(timestamp.seconds * 1000).toLocaleDateString('zh-TW');
      } else if (typeof timestamp === 'string') {
        // ISO 字串格式
        return new Date(timestamp).toLocaleDateString('zh-TW');
      }
      
      // 其他格式，嘗試直接轉換
      return new Date(timestamp).toLocaleDateString('zh-TW');
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return '';
    }
  };
  
  // 格式化交易時間顯示
  const formatAvailableTimes = (availableTimes) => {
    if (!availableTimes) return '無指定時間';
    
    const orderedDays = [
      { key: 'monday', label: '週一' },
      { key: 'tuesday', label: '週二' },
      { key: 'wednesday', label: '週三' },
      { key: 'thursday', label: '週四' },
      { key: 'friday', label: '週五' },
      { key: 'saturday', label: '週六' },
      { key: 'sunday', label: '週日' }
    ];
    
    // 過濾出已選擇的日期，按固定順序
    const selectedDays = orderedDays
      .filter(day => availableTimes[day.key] === true)
      .map(day => day.label);
    
    return selectedDays.length > 0 ? selectedDays.join('、') : '無指定時間';
  };
  
  return (
    <>
      <Card className="productCard">
        <CardActionArea 
          onClick={handleClick} 
          className={`cardActionArea ${(!product.stock || product.stock < 1) ? 'soldOut' : ''}`}
        >
          {/* 商品圖片 */}
          <CardMedia
            component="img"
            height="200"
            image={product.images && product.images.length > 0 ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300x200?text=無圖片')}
            alt={product.name}
            className={`productImage ${(!product.stock || product.stock < 1) ? 'soldOut' : ''}`}
          />
          
          {/* 分類標籤，定位在圖片左上角 */}
          <Chip 
            label={product.category} 
            size="small" 
            color="primary" 
            variant="filled"
            className="categoryChip"
          />
          
          {/* 贈送商品標籤 */}
          {product.isGiveaway && (
            <Chip 
              label="免費贈送" 
              size="small" 
              color="success" 
              variant="filled"
              className="giveawayChip"
              style={{ position: 'absolute', top: '8px', right: '8px' }}
            />
          )}
          
          {/* 售完標籤 */}
          {(!product.stock || product.stock < 1) && (
            <Chip 
              label={product.isGiveaway ? "已贈送" : "已售完"} 
              size="small" 
              color="error" 
              variant="filled"
              className="soldOutChip"
            />
          )}
          
          <CardContent className="productContent">
            {/* 商品名稱 */}
            <Typography 
              variant="h6" 
              component="div" 
              className="productName"
            >
              {product.name}
            </Typography>
            
            {/* 商品價格 */}
            <Typography 
              variant="h6" 
              color="error" 
              className="productPrice"
            >
              {product.isGiveaway ? '免費贈送' : `NT$ ${Math.round(product.price).toLocaleString()}`}
            </Typography>
            
            {/* 狀況 */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ fontWeight: 500, mb: 0.5 }}
            >
              狀況：{product.condition || '未知'}
            </Typography>
            
            {/* 位置、上架時間和上架者 */}
            <Box className="productInfo">
              {/* 上架者信息 */}
              <Box className="productSeller">
                <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {product.userName || '匿名用戶'}
                </Typography>
              </Box>
            
              {/* 位置信息 */}
              <Box className="productLocation">
                <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {product.location || '輔仁大學'}
                </Typography>
              </Box>
              
              {/* 上架時間 */}
              <Box className="productDate">
                <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {product.createdAt ? formatDate(product.createdAt) : ''}
                </Typography>
              </Box>
              
              {/* 交易時間 */}
              <Box className="productTime">
                <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {formatAvailableTimes(product.sellerAvailableTimes)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      {/* 登入提示對話框 */}
      <Dialog
        open={loginDialogOpen}
        onClose={handleLoginDialogClose}
        aria-labelledby="login-dialog-title"
        aria-describedby="login-dialog-description"
      >
        <DialogTitle id="login-dialog-title">
          請先登入
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="login-dialog-description">
            您需要先登入才能查看商品詳情並與賣家聯繫。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoginDialogClose} color="primary">
            取消
          </Button>
          <Button onClick={goToLogin} color="primary" autoFocus>
            前往登入
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductCard; 
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Badge
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ChatIconComponent from './ChatIcon';
import '../styles/layout/Navbar.css';

const Navbar = () => {
  const { currentUser, logout, getUserData } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 從 Firestore 獲取用戶頭像
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData(currentUser.uid);
          if (userData && userData.photoURL) {
            setUserAvatar(userData.photoURL);
          } else {
            // 如果 Firestore 中沒有頭像，使用 Auth 中的頭像（如果有）
            setUserAvatar(currentUser.photoURL || '');
          }
        } catch (error) {
          console.error('獲取用戶頭像失敗:', error);
          // 出錯時使用 Auth 中的頭像
          setUserAvatar(currentUser.photoURL || '');
        }
      } else {
        setUserAvatar('');
      }
    };

    fetchUserAvatar();
  }, [currentUser, getUserData]);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openLogoutDialog = () => {
    handleMenuClose();
    setLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setLogoutDialogOpen(false);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeLogoutDialog();
      // 顯示登出成功訊息
      setNotification({
        open: true,
        message: '已成功登出',
        severity: 'success'
      });
      // 1秒後跳轉到首頁
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('登出錯誤:', error);
      setNotification({
        open: true,
        message: '登出失敗，請稍後再試',
        severity: 'error'
      });
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {/* 標題 */}
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold'
            }}
          >
            輔仁大學外宿生二手交易平台
          </Typography>

          {/* 商品鏈接 */}
          <Button 
            component={Link} 
            to="/" 
            color="inherit"
            sx={{ mr: 2 }}
          >
            商品列表
          </Button>

          {/* 未登入顯示登入註冊，已登入顯示個人資料 */}
          {currentUser ? (
            <Box>

              <Button 
                component={Link} 
                to="/giveaway" 
                color="inherit"
                sx={{ mr: 2 }}
              >
                贈送專區
              </Button>
           
              <Button 
                component={Link} 
                to="/add-product" 
                color="inherit"
                sx={{ mr: 2 }}
              >
                上架商品
              </Button>
              <Button 
                component={Link} 
                to="/my-products" 
                color="inherit"
                sx={{ mr: 2 }}
              >
                我的商品
              </Button>
              <Button 
                component={Link} 
                to="/orders" 
                color="inherit"
                sx={{ mr: 2 }}
              >
                我的訂單
              </Button>
              {/* 聊天圖標 */}
              <ChatIconComponent />
              {/* 購物車圖示 */}
              <IconButton
                component={Link}
                to="/cart"
                color="inherit"
                sx={{ mr: 2 }}
              >
                <Badge badgeContent={getCartCount()} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar 
                  sx={{ width: 32, height: 32 }}
                  alt={currentUser.displayName || '用戶'}
                  src={userAvatar}
                >
                  {!userAvatar && (currentUser.displayName ? currentUser.displayName.charAt(0) : currentUser.email.charAt(0).toUpperCase())}
                </Avatar>
              </IconButton>
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem 
                  onClick={() => {
                    handleMenuClose();
                    navigate('/profile');
                  }}
                >
                  個人資料
                </MenuItem>
                <MenuItem onClick={openLogoutDialog}>登出</MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              <Button 
                component={Link} 
                to="/login" 
                color="inherit"
                sx={{ mr: 1 }}
              >
                登入
              </Button>
              <Button 
                component={Link} 
                to="/register" 
                color="inherit"
                variant="outlined"
              >
                註冊
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* 登出確認對話框 */}
      <Dialog
        open={logoutDialogOpen}
        onClose={closeLogoutDialog}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          {"確認登出"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            您確定要登出嗎？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLogoutDialog} color="primary">
            取消
          </Button>
          <Button onClick={handleLogout} color="primary" autoFocus>
            確認登出
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知提示 */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={3000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;
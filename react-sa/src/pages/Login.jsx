import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Alert,
  IconButton,
  Snackbar,
  InputAdornment,
  CircularProgress,
  Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, validateEmail, validatePassword, error: authError, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 檢查是否有從其他頁面傳來的註冊成功通知
  useEffect(() => {
    // 檢查來自註冊頁面的成功訊息
    if (location.state?.from === 'register' && location.state?.success) {
      setNotification({
        open: true,
        message: '註冊成功！請使用您的帳號密碼登入',
        severity: 'success'
      });
      
      // 清除location.state，避免重新整理頁面時再次顯示通知
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 當authError發生變化時，更新本地錯誤狀態
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  const validateForm = () => {
    // 清除先前的錯誤
    setLocalError('');
    setError('');
    
    // 驗證表單欄位
    const emailError = validateEmail(email);
    if (emailError) {
      setLocalError(emailError);
      return false;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      setLocalError(passwordError);
      return false;
    }
    
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      await login(email, password);
      setNotification({
        open: true,
        message: '登入成功！',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      // 錯誤已在AuthContext中處理，不需要在這裡再處理
      console.error('登入失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 當用戶開始輸入時清除錯誤
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    
    if (localError || authError) {
      setLocalError('');
      setError('');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
      <Box className="loginContainer">
        <Paper className="loginPaper">
          <Typography component="h1" variant="h5" className="loginTitle">
            帳號登入
          </Typography>
          
          {(localError || authError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {localError || authError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} noValidate className="loginForm">
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="電子郵件"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleInputChange}
              className="loginField"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密碼"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              className="passwordField"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              className="submitButton"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '登入'}
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Link to="/forgot-password" className="forgotPasswordLink">
                忘記密碼？
              </Link>
              
              <Button 
                component={Link} 
                to="/register" 
                variant="outlined" 
                size="small"
                className="registerLink"
              >
                立即註冊新帳號
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 
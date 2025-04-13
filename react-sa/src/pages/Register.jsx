import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Snackbar
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import '../styles/pages/Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { signup, validateEmail, validatePassword, error: authError, setError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 當authError發生變化時，更新本地錯誤狀態
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  // 當註冊成功時，直接跳轉到登入頁面
  useEffect(() => {
    if (success) {
      // 確保成功時清除任何錯誤訊息
      setLocalError('');
      setError('');
      // 直接跳轉到登入頁面，並傳遞成功狀態
      navigate('/login', { state: { from: 'register', success: true }});
    }
  }, [success, navigate, setError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // 當用戶開始修改表單時，清除錯誤
    if (localError || authError) {
      setLocalError('');
      setError('');
    }
  };

  const validateForm = () => {
    // 清除之前的錯誤
    setLocalError('');
    setError('');
    
    // 驗證姓名
    if (!formData.name.trim()) {
      setLocalError('請輸入您的姓名');
      return false;
    }
    
    // 驗證電子郵件
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setLocalError(emailError);
      return false;
    }
    
    // 驗證密碼
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setLocalError(passwordError);
      return false;
    }
    
    // 驗證確認密碼
    if (formData.password !== formData.confirmPassword) {
      setLocalError('兩次輸入的密碼不一致');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // 使用AuthContext中的signup函數
      await signup(formData.email, formData.password, formData.name);
      setSuccess(true); // 設置成功狀態
    } catch (error) {
      // 錯誤已在AuthContext中處理，這裡只需要確保重置成功狀態
      console.error('註冊失敗:', error);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box className="registerContainer">
        <Paper className="registerPaper">
          <Typography component="h1" variant="h5" className="registerTitle">
            註冊新帳號
          </Typography>
          
          {(localError || authError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {localError || authError}
            </Alert>
          )}
          
          <Box component="form" noValidate onSubmit={handleSubmit} className="registerForm">
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="姓名"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              className="registerField"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="電子郵件"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="registerField"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密碼（至少6個字符）"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
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
              className="registerField"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="確認密碼"
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              className="registerField"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              className="submitButton"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '註冊'}
            </Button>
          </Box>
          
          <Divider sx={{ width: '100%', my: 2 }} />
          
          <Box className="loginPrompt">
            <Button 
              component={Link} 
              to="/login" 
              variant="text" 
              size="small"
              className="loginLink"
            >
              已有帳號？點此登入
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 
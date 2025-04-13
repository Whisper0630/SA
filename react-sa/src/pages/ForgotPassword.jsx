import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Alert,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('請輸入您的電子郵件');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      console.error('重設密碼失敗:', error);
      if (error.code === 'auth/invalid-email') {
        setError('無效的電子郵件格式');
      } else if (error.code === 'auth/user-not-found') {
        setError('找不到此帳號');
      } else {
        setError('重設密碼請求失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box 
        sx={{ 
          mt: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Box sx={{ position: 'absolute', top: 90, right: 24 }}>
          <IconButton 
            component={Link} 
            to="/" 
            color="primary" 
            aria-label="返回首頁"
          >
            <ArrowBackIcon /> <Typography variant="button" sx={{ ml: 1 }}>返回首頁</Typography>
          </IconButton>
        </Box>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            忘記密碼
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          
          {emailSent ? (
            <>
              <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
                重設密碼郵件已發送！請檢查您的電子郵件。
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                如果您沒有收到郵件，請檢查您的垃圾郵件箱，或稍後再試。
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/login"
                sx={{ mt: 2 }}
              >
                返回登入頁面
              </Button>
            </>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                請輸入您的電子郵件地址，我們將向您發送一封含有重設密碼連結的郵件。
              </Typography>
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
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? '發送中...' : '發送重設密碼郵件'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  component={Link} 
                  to="/login" 
                  variant="text" 
                  size="small"
                >
                  返回登入頁面
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 
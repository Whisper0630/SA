import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../firebase/config';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [oobCode, setOobCode] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    // 從URL獲取重設密碼的代碼
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('oobCode');
    
    if (code) {
      setOobCode(code);
      verifyCode(code);
    } else {
      setVerificationError('無效的密碼重設連結');
      setVerifying(false);
    }
  }, [location]);

  const verifyCode = async (code) => {
    try {
      // 驗證重設密碼代碼
      const email = await verifyPasswordResetCode(auth, code);
      setEmail(email);
      setVerifying(false);
    } catch (error) {
      console.error('驗證密碼重設代碼失敗:', error);
      setVerificationError('此密碼重設連結無效或已過期');
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表單驗證
    if (newPassword.length < 6) {
      setError('密碼長度至少需要6個字符');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // 確認密碼重設
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      
      // 3秒後跳轉至登入頁面
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('重設密碼失敗:', error);
      setError('重設密碼失敗，請再試一次或重新申請密碼重設');
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
            重設密碼
          </Typography>
          
          {verifying && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              正在驗證您的密碼重設請求...
            </Alert>
          )}
          
          {verificationError && (
            <>
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{verificationError}</Alert>
              <Button 
                component={Link} 
                to="/login" 
                variant="contained" 
                color="primary"
                sx={{ mt: 2 }}
              >
                返回登入頁面
              </Button>
            </>
          )}
          
          {!verifying && !verificationError && (
            <>
              {success ? (
                <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                  密碼已成功重設！3秒後將自動跳轉至登入頁面。
                </Alert>
              ) : (
                <>
                  {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    請為帳號 <strong>{email}</strong> 設置新密碼
                  </Typography>
                  
                  <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="newPassword"
                      label="新密碼（至少6個字符）"
                      type="password"
                      id="newPassword"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="confirmPassword"
                      label="確認新密碼"
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      sx={{ mt: 3, mb: 2 }}
                    >
                      {loading ? '處理中...' : '重設密碼'}
                    </Button>
                  </Box>
                </>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword; 
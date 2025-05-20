import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Alert, 
  Divider,
  Grid,
  Avatar,
  CircularProgress,
  Snackbar,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import '../styles/pages/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, getUserData, updateUserData, error: authError, setError } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    photoURL: '',
    availableTimes: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入使用者資料
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setFormData({
            displayName: userData.displayName || '',
            phoneNumber: userData.phoneNumber || '',
            photoURL: userData.photoURL || '',
            availableTimes: userData.availableTimes || {
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false
            }
          });
          setAvatarPreview(userData.photoURL || '');
        }
      } catch (error) {
        console.error('獲取用戶資料失敗:', error);
        setLocalError('載入資料失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, getUserData, navigate]);

  // 處理表單變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 對電話號碼格式做特殊處理
    if (name === 'phoneNumber') {
      // 僅接受數字輸入
      const numericValue = value.replace(/\D/g, '');
      
      // 限制最多 10 位數字
      if (numericValue.length <= 10) {
        setFormData({
          ...formData,
          [name]: numericValue,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // 當用戶開始修改表單時，清除錯誤和成功訊息
    if (localError || authError) {
      setLocalError('');
      setError('');
    }
    if (success) {
      setSuccess(false);
    }
  };

  // 點擊頭像或按鈕觸發檔案選擇
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // 處理頭像檔案選擇
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.type.match('image.*')) {
      setLocalError('請上傳圖片檔案');
      return;
    }

    // 檢查檔案大小 (2MB 限制)
    if (file.size > 2 * 1024 * 1024) {
      setLocalError('圖片大小不能超過 2MB');
      return;
    }

    setAvatarFile(file);
    
    // 建立預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // 清除任何錯誤和成功訊息
    if (localError || authError) {
      setLocalError('');
      setError('');
    }
    if (success) {
      setSuccess(false);
    }
  };

  // 壓縮圖片並轉換為Base64
  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // 創建canvas進行壓縮
          const canvas = document.createElement('canvas');
          // 設定適當的尺寸，控制大小，最大寬度或高度為400像素
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // 壓縮為JPEG，品質0.8（80%）
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedBase64);
        };
      };
    });
  };

  // 表單驗證
  const validateForm = () => {
    // 清除之前的錯誤
    setLocalError('');
    setError('');
    
    // 驗證姓名
    if (!formData.displayName.trim()) {
      setLocalError('請輸入您的姓名');
      return false;
    }
    
    // 驗證電話號碼（如果已輸入）
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      setLocalError('連絡電話必須是10位數字');
      return false;
    }
    
    return true;
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setUpdating(true);

    try {
      // 如果有新的頭像檔案，先壓縮並轉換為 base64
      let photoURL = formData.photoURL;
      if (avatarFile) {
        photoURL = await compressAndConvertToBase64(avatarFile);
      }
      
      // 更新使用者資料
      await updateUserData(currentUser.uid, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        photoURL: photoURL,
        availableTimes: formData.availableTimes
      });
      
      // 更新表單資料的 photoURL
      setFormData({
        ...formData,
        photoURL: photoURL
      });

      setAvatarFile(null);
      setSuccess(true);
      setNotification({
        open: true,
        message: '個人資料已成功更新',
        severity: 'success'
      });
    } catch (error) {
      console.error('更新失敗:', error);
      setLocalError(error.message || '更新失敗，請稍後再試');
      setNotification({
        open: true,
        message: error.message || '更新失敗，請稍後再試',
        severity: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  // 關閉通知
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // 處理交易時間變更
  const handleTimeChange = (day) => {
    setFormData({
      ...formData,
      availableTimes: {
        ...formData.availableTimes,
        [day]: !formData.availableTimes[day]
      }
    });
  };

  // 如果正在載入，顯示載入中
  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box className="profileContainer" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box className="profileContainer">
        <Paper className="profilePaper">
          <Typography component="h1" variant="h5" className="profileTitle">
            個人資料
          </Typography>
          
          {(localError || authError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {localError || authError}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              個人資料已成功更新
            </Alert>
          )}
          
          <Box component="form" noValidate onSubmit={handleSubmit} className="profileForm">
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                {/* 頭像上傳區域 */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                
                <Avatar 
                  src={avatarPreview} 
                  alt={formData.displayName}
                  sx={{ width: 100, height: 100, cursor: 'pointer' }}
                  className="avatar"
                  onClick={handleAvatarClick}
                >
                  {!avatarPreview && formData.displayName ? formData.displayName.charAt(0).toUpperCase() : ''}
                </Avatar>
                
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleAvatarClick}
                  size="small"
                  className="avatarButton"
                  disabled={updating}
                >
                  {updating ? '處理中...' : '更換頭像'}
                </Button>
                
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                  點擊頭像或按鈕上傳照片 (2MB以內)
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="displayName"
                  label="姓名"
                  name="displayName"
                  autoComplete="name"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="profileField"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  方便交易時間
                </Typography>
                <FormGroup row>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.availableTimes.monday}
                            onChange={() => handleTimeChange('monday')}
                          />
                        }
                        label="週一"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.availableTimes.tuesday}
                            onChange={() => handleTimeChange('tuesday')}
                          />
                        }
                        label="週二"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.availableTimes.wednesday}
                            onChange={() => handleTimeChange('wednesday')}
                          />
                        }
                        label="週三"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.availableTimes.thursday}
                            onChange={() => handleTimeChange('thursday')}
                          />
                        }
                        label="週四"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.availableTimes.friday}
                            onChange={() => handleTimeChange('friday')}
                          />
                        }
                        label="週五"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.availableTimes.saturday}
                            onChange={() => handleTimeChange('saturday')}
                          />
                        }
                        label="週六"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.availableTimes.sunday}
                            onChange={() => handleTimeChange('sunday')}
                          />
                        }
                        label="週日"
                      />
                    </Grid>
                  </Grid>
                </FormGroup>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="phoneNumber"
                  label="連絡電話"
                  name="phoneNumber"
                  autoComplete="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="profileField"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 10,
                  }}
                  placeholder="請輸入10位數電話號碼（選填）"
                  helperText={formData.phoneNumber ? `${formData.phoneNumber.length}/10 位數字` : '選填'}
                  error={formData.phoneNumber.length > 0 && formData.phoneNumber.length !== 10}
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={updating}
              className="submitButton"
            >
              {updating ? <CircularProgress size={24} color="inherit" /> : '更新資料'}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/')}
              className="cancelButton"
              disabled={updating}
            >
              返回首頁
            </Button>
          </Box>
        </Paper>
      </Box>
      
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
    </Container>
  );
};

export default Profile; 
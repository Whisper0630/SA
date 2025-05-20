import React, { useState, useCallback } from 'react';
import { TextField, Button, Box, Typography, Grid, Paper, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useAuth } from '../contexts/AuthContext';
import { useProduct } from '../contexts/ProductContext';
import '../styles/components/ProductForm.css';

const ProductForm = ({ mode = 'create', initialData = null, onSuccess }) => {
  const { currentUser } = useAuth();
  const { createProduct, updateProduct } = useProduct();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    category: initialData?.category || '',
    condition: initialData?.condition || '',
    imageFiles: [],
    originalImages: initialData?.images || [],
    isGiveaway: initialData?.isGiveaway || false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.imageFiles.length > 5) {
      setError('最多只能上傳5張圖片');
      return;
    }
    setFormData(prev => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...files]
    }));
  }, [formData.imageFiles]);

  const handleRemoveImage = (index, isOriginal = false) => {
    if (isOriginal) {
      setFormData(prev => ({
        ...prev,
        originalImages: prev.originalImages.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        imageFiles: prev.imageFiles.filter((_, i) => i !== index)
      }));
    }
  };

  const compressAndConvertToBase64 = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 計算壓縮比例
          const maxSize = 800;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // 壓縮圖片質量
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedImage);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }, []);

  const convertImagesToBase64 = useCallback(async () => {
    const newImages = await Promise.all(
      formData.imageFiles.map(file => compressAndConvertToBase64(file))
    );
    return [...formData.originalImages, ...newImages];
  }, [formData.imageFiles, formData.originalImages, compressAndConvertToBase64]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.description || !formData.category || !formData.condition) {
        throw new Error('請填寫所有必填欄位');
      }

      if (!formData.isGiveaway && !formData.price) {
        throw new Error('請輸入商品價格');
      }

      if (formData.originalImages.length + formData.imageFiles.length === 0) {
        throw new Error('請至少上傳一張商品圖片');
      }

      const images = await convertImagesToBase64();
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.isGiveaway ? 0 : Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        images,
        isGiveaway: formData.isGiveaway,
        userId: currentUser.uid,
        userName: currentUser.displayName || '匿名用戶',
        createdAt: new Date().toISOString()
      };

      if (mode === 'create') {
        await createProduct(productData);
      } else {
        await updateProduct(initialData.id, productData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} className="product-form-container">
      <Box component="form" onSubmit={handleSubmit} className="product-form">
        <Typography variant="h5" component="h2" gutterBottom className="form-title">
          {mode === 'create' ? '新增商品' : '編輯商品'}
        </Typography>

        {error && (
          <Typography color="error" className="error-message">
            {error}
          </Typography>
        )}

        <Grid container spacing={3}>
          {/* 商品名稱 */}
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="商品名稱"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-field"
            />
          </Grid>

          {/* 商品描述 */}
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="商品描述"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-field"
            />
          </Grid>

          {/* 商品分類 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required className="form-field">
              <InputLabel>商品分類</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                label="商品分類"
              >
                <MenuItem value="electronics">電子產品</MenuItem>
                <MenuItem value="clothing">服飾</MenuItem>
                <MenuItem value="books">書籍</MenuItem>
                <MenuItem value="furniture">家具</MenuItem>
                <MenuItem value="others">其他</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 商品狀態 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required className="form-field">
              <InputLabel>商品狀態</InputLabel>
              <Select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                label="商品狀態"
              >
                <MenuItem value="new">全新</MenuItem>
                <MenuItem value="like-new">近全新</MenuItem>
                <MenuItem value="good">良好</MenuItem>
                <MenuItem value="fair">普通</MenuItem>
                <MenuItem value="poor">差</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 商品價格 */}
          <Grid item xs={12} sm={6}>
            <TextField
              required={!formData.isGiveaway}
              fullWidth
              type="number"
              label="商品價格"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              disabled={formData.isGiveaway}
              className="form-field"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Grid>

          {/* 免費贈送選項 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth className="form-field">
              <InputLabel>是否免費贈送</InputLabel>
              <Select
                name="isGiveaway"
                value={formData.isGiveaway}
                onChange={handleInputChange}
                label="是否免費贈送"
              >
                <MenuItem value={false}>否</MenuItem>
                <MenuItem value={true}>是</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 圖片上傳 */}
          <Grid item xs={12}>
            <Box className="image-upload-container">
              <input
                accept="image/*"
                type="file"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}
                  className="upload-button"
                >
                  上傳圖片
                </Button>
              </label>
              <Typography variant="caption" color="textSecondary" className="image-limit">
                最多可上傳5張圖片
              </Typography>
            </Box>

            {/* 圖片預覽 */}
            <Box className="image-preview-container">
              {formData.originalImages.map((image, index) => (
                <Box key={`original-${index}`} className="image-preview-item">
                  <img src={image} alt={`商品圖片 ${index + 1}`} className="preview-image" />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveImage(index, true)}
                    className="remove-image-button"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              {formData.imageFiles.map((file, index) => (
                <Box key={`new-${index}`} className="image-preview-item">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`新上傳圖片 ${index + 1}`}
                    className="preview-image"
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveImage(index)}
                    className="remove-image-button"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* 提交按鈕 */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              className="submit-button"
            >
              {loading ? '處理中...' : mode === 'create' ? '新增商品' : '更新商品'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProductForm; 
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Button, Container } from '@mui/material';

const categories = [
  { id: 'all', label: '全部分類', path: '/' },
  { id: '家具家電', label: '家具家電', path: '/category/家具家電' },
  { id: '書籍教材', label: '書籍教材', path: '/category/書籍教材' },
  { id: '生活用品', label: '生活用品', path: '/category/生活用品' },
  { id: '3C產品', label: '3C產品', path: '/category/3C產品' },
  { id: '服飾', label: '服飾', path: '/category/服飾' },
  { id: '交通工具', label: '交通工具', path: '/category/交通工具' },
  { id: '美妝保養', label: '美妝保養', path: '/category/美妝保養' },
  { id: '其他', label: '其他', path: '/category/其他' }
];

const CategoryBar = ({ currentCategory }) => {
  const location = useLocation();

  // 獲取當前活動的分類
  const getActiveCategory = () => {
    // 如果明確傳入當前分類，優先使用它
    if (currentCategory) {
      return currentCategory;
    }
    
    // 從URL路徑推導當前分類
    const path = location.pathname;
    
    // 處理首頁
    if (path === '/') {
      return 'all';
    }
    
    // 處理分類頁面
    if (path.startsWith('/category/')) {
      return decodeURIComponent(path.split('/category/')[1]);
    }
    
    return null;
  };
  
  const activeCategory = getActiveCategory();

  return (
    <Box 
      sx={{ 
        bgcolor: 'background.paper', 
        boxShadow: 1,
        borderBottom: '1px solid #e0e0e0',
        mb: 2
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            display: 'flex', 
            overflowX: 'auto',
            py: 1,
            '&::-webkit-scrollbar': {
              height: '4px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: '4px'
            }
          }}
        >
          {categories.map((category) => {
            // 判斷當前分類是否為活動分類
            let isActive = false;
            
            // 首頁按鈕只在首頁路徑下高亮
            if (category.id === 'all') {
              isActive = activeCategory === 'all' || location.pathname === '/';
            } else {
              // 其他分類按鈕判斷邏輯
              isActive = 
                category.id === activeCategory || 
                category.label === activeCategory || 
                location.pathname === category.path;
            }
            
            return (
              <Button
                component={Link}
                to={category.path}
                key={category.id}
                sx={{ 
                  mx: 1, 
                  whiteSpace: 'nowrap',
                  color: isActive ? 'primary.main' : 'text.primary',
                  fontWeight: isActive ? 'bold' : 'normal',
                  borderBottom: isActive ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                    borderBottom: 2,
                    borderColor: 'primary.light'
                  }
                }}
              >
                {category.label}
              </Button>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default CategoryBar; 
import React from 'react';
import { Container, Typography, Box, AppBar, Toolbar, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const ChatRoomPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        p: 0, 
        overflow: 'hidden'
      }}
    >
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            測試頁面 - 聊天室列表
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          p: 3
        }}
      >
        <Typography variant="h4" gutterBottom>
          聊天室列表測試頁面
        </Typography>
        <Typography variant="body1">
          如果您看到此頁面，表示路由配置正常工作。
        </Typography>
      </Box>
    </Container>
  );
};

export default ChatRoomPage; 
import React, { useState, useEffect } from 'react';
import { Box, Avatar, Typography, Paper } from '@mui/material';
import { getUserData } from '../services/chatService';

const MessageItem = ({ message, currentUser }) => {
  const isCurrentUser = message.sender === currentUser?.uid;
  const [senderAvatar, setSenderAvatar] = useState('');
  
  // 獲取發送者的頭像
  useEffect(() => {
    const fetchSenderAvatar = async () => {
      if (!isCurrentUser && message.sender) {
        try {
          const userData = await getUserData(message.sender);
          if (userData && userData.photoURL) {
            setSenderAvatar(userData.photoURL);
          }
        } catch (error) {
          console.error('獲取發送者頭像失敗:', error);
        }
      }
    };
    
    fetchSenderAvatar();
  }, [message.sender, isCurrentUser]);
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        opacity: 0,
        animation: 'fadeIn 0.3s ease forwards',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      {!isCurrentUser && (
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            mr: 1,
            bgcolor: 'primary.light'
          }}
          src={senderAvatar}
        >
          {!senderAvatar && (message.senderName?.charAt(0).toUpperCase() || '?')}
        </Avatar>
      )}
      
      <Box sx={{ maxWidth: '70%' }}>
        {!isCurrentUser && (
          <Typography 
            variant="caption" 
            sx={{ 
              ml: 1, 
              mb: 0.5, 
              display: 'block',
              color: 'text.secondary'
            }}
          >
            {message.senderName || '未知用戶'}
          </Typography>
        )}
        
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: '16px',
            bgcolor: isCurrentUser ? 'primary.main' : 'grey.100',
            color: isCurrentUser ? 'white' : 'text.primary',
            position: 'relative',
            maxWidth: '100%',
            wordBreak: 'break-word',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 0,
              height: 0,
              borderStyle: 'solid',
              ...(isCurrentUser ? {
                right: -8,
                borderWidth: '8px 0 8px 8px',
                borderColor: `transparent transparent transparent ${theme => theme.palette.primary.main}`
              } : {
                left: -8,
                borderWidth: '8px 8px 8px 0',
                borderColor: `transparent ${theme => theme.palette.grey[100]} transparent transparent`
              }),
              top: '50%',
              transform: 'translateY(-50%)'
            }
          }}
        >
          <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
            {message.text}
          </Typography>
        </Paper>
        
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 0.5,
            display: 'block',
            textAlign: isCurrentUser ? 'right' : 'left',
            color: 'text.secondary',
            fontSize: '0.75rem'
          }}
        >
          {message.timestamp ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString() : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default MessageItem; 
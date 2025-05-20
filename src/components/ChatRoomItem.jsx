import React from 'react';
import { ListItem, ListItemAvatar, ListItemText, Avatar, Badge, Typography, Box } from '@mui/material';
import { getUserData } from '../services/chatService';

const ChatRoomItem = ({ room, currentUser, onClick, isActive }) => {
  const [otherUserAvatar, setOtherUserAvatar] = React.useState('');
  const [otherUserName, setOtherUserName] = React.useState('未知用戶');
  const unreadCount = room.unreadCount?.[currentUser?.uid] || 0;

  // 獲取對方用戶資訊
  React.useEffect(() => {
    const fetchOtherUserInfo = async () => {
      if (!currentUser || !room) return;
      
      const otherUserId = room.participants.find(id => id !== currentUser.uid);
      if (!otherUserId) return;
      
      try {
        const userData = await getUserData(otherUserId);
        if (userData) {
          setOtherUserName(userData.displayName || '未知用戶');
          if (userData.photoURL) {
            setOtherUserAvatar(userData.photoURL);
          }
        }
      } catch (error) {
        console.error('獲取對方用戶資訊失敗:', error);
      }
    };
    
    fetchOtherUserInfo();
  }, [room, currentUser]);

  return (
    <ListItem 
      button 
      onClick={onClick}
      sx={{
        backgroundColor: isActive 
          ? 'rgba(25, 118, 210, 0.08)' 
          : (unreadCount > 0 ? 'rgba(0, 150, 255, 0.04)' : 'inherit'),
        '&:hover': {
          backgroundColor: isActive 
            ? 'rgba(25, 118, 210, 0.12)' 
            : (unreadCount > 0 ? 'rgba(0, 150, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
        },
        borderLeft: isActive ? '3px solid' : 'none',
        borderColor: '#1976d2',
        borderBottom: '1px solid',
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        pl: isActive ? 1.5 : 2,
        py: 1.5
      }}
    >
      <ListItemAvatar>
        <Badge 
          color="error" 
          badgeContent={unreadCount} 
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          invisible={isActive || unreadCount === 0}
        >
          <Avatar 
            sx={{ 
              bgcolor: isActive ? '#1976d2' : '#e0e0e0',
              width: 44,
              height: 44
            }}
            src={otherUserAvatar}
          >
            {!otherUserAvatar && otherUserName.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography 
              variant="subtitle2" 
              sx={{
                fontWeight: (unreadCount > 0 && !isActive) ? 'bold' : 'normal',
                color: isActive ? 'primary.main' : 'text.primary'
              }}
            >
              {otherUserName}
            </Typography>
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: (unreadCount > 0 && !isActive) ? 'text.primary' : 'text.secondary',
                fontWeight: (unreadCount > 0 && !isActive) ? 'bold' : 'normal',
                fontSize: '0.8rem'
              }}
            >
              {room.lastMessage ? 
                (room.lastMessage.length > 20 ? `${room.lastMessage.substring(0, 20)}...` : room.lastMessage) 
                : "沒有訊息"}
            </Typography>
          </Box>
        }
        secondary={
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.7rem',
              display: 'block',
              mt: 0.5
            }}
          >
            {room.lastMessageTime ? new Date(room.lastMessageTime.seconds * 1000).toLocaleTimeString() : ''}
          </Typography>
        }
        sx={{ m: 0 }}
      />
    </ListItem>
  );
};

export default ChatRoomItem; 
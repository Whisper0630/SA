import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Divider, Paper, AppBar, Toolbar, 
  IconButton, Badge, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getUserChatRooms } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const ChatRoomList = () => {
  console.log('ChatRoomList 組件正在加載...');

  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 獲取所有聊天室
  useEffect(() => {
    console.log('ChatRoomList useEffect 執行, currentUser:', currentUser?.uid);
    let unsubscribe = () => {};

    if (currentUser) {
      unsubscribe = getUserChatRooms((rooms) => {
        console.log('獲取到聊天室:', rooms.length);
        setChatRooms(rooms);
        setLoading(false);
      });
    } else {
      // 未登入則導向登入頁
      console.log('用戶未登入，重定向到登入頁面');
      navigate('/login');
    }

    return () => unsubscribe();
  }, [currentUser, navigate]);

  // 格式化時間
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
    } catch (error) {
      console.error('時間格式化錯誤', error);
      return '';
    }
  };

  // 獲取指定聊天室的對方用戶名稱
  const getOtherUserName = (room) => {
    if (!currentUser || !room.participantNames) return '未知用戶';
    
    for (const [userId, name] of Object.entries(room.participantNames)) {
      if (userId !== currentUser.uid) {
        return name || '未知用戶';
      }
    }
    
    return '未知用戶';
  };

  // 獲取聊天室的未讀消息數
  const getRoomUnreadCount = (room) => {
    if (!currentUser || !room.unreadCount) return 0;
    return room.unreadCount[currentUser.uid] || 0;
  };

  // 處理聊天室點擊
  const handleRoomClick = (roomId) => {
    console.log('點擊聊天室，導航到:', `/chat/${roomId}`);
    navigate(`/chat/${roomId}`);
  };

  // 返回按鈕
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
      {/* 頂部導航欄 */}
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
            我的消息
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* 聊天室列表 */}
      <Paper 
        elevation={0}
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          bgcolor: 'background.default',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : chatRooms.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              還沒有聊天記錄
            </Typography>
          </Box>
        ) : (
          <List>
            {chatRooms.map((room, index) => {
              const otherUserName = getOtherUserName(room);
              const unreadCount = getRoomUnreadCount(room);
              
              return (
                <React.Fragment key={room.id}>
                  <ListItem 
                    button 
                    onClick={() => handleRoomClick(room.id)}
                    sx={{
                      backgroundColor: unreadCount > 0 ? 'rgba(0, 150, 255, 0.08)' : 'inherit',
                      '&:hover': {
                        backgroundColor: unreadCount > 0 ? 'rgba(0, 150, 255, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                      },
                      px: 2,
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
                      >
                        <Avatar>
                          {otherUserName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography 
                            component="span" 
                            variant="subtitle1" 
                            sx={{
                              fontWeight: unreadCount > 0 ? 'bold' : 'normal'
                            }}
                          >
                            {otherUserName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(room.lastMessageTime)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          {room.productName && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ 
                                display: 'block',
                                color: 'text.secondary',
                                mb: 0.5
                              }}
                            >
                              商品: {room.productName}
                            </Typography>
                          )}
                          <Typography
                            component="span"
                            variant="body2"
                            color={unreadCount > 0 ? "text.primary" : "text.secondary"}
                            sx={{
                              display: 'inline',
                              fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                            }}
                          >
                            {room.lastMessage ? 
                              (room.lastMessage.length > 35 ? `${room.lastMessage.substring(0, 35)}...` : room.lastMessage) 
                              : "沒有訊息"}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < chatRooms.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default ChatRoomList; 
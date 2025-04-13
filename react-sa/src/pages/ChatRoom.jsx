import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Paper, Typography, TextField, Button, 
  Avatar, Box, CircularProgress, Divider, IconButton,
  AppBar, Toolbar, Grid, List, ListItem, ListItemAvatar, 
  ListItemText, Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import { listenToMessages, sendMessage, getUserChatRooms } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const ChatRoom = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [otherUserName, setOtherUserName] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // 滾動和消息相關的 ref
  const messagesContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const scrollPositionRef = useRef({ top: 0, height: 0 });
  const scrollTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  // 獲取所有聊天室
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (currentUser) {
      unsubscribe = getUserChatRooms((rooms) => {
        setChatRooms(rooms);
        setLoadingRooms(false);
      });
    }
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // 獲取指定聊天室的對方用戶名稱
  const getOtherUserName = (room) => {
    if (!currentUser || !room || !room.participantNames) return '未知用戶';
    
    for (const [userId, name] of Object.entries(room.participantNames)) {
      if (userId !== currentUser.uid) {
        return name || '未知用戶';
      }
    }
    
    return '未知用戶';
  };
  
  // 獲取聊天室的未讀消息數
  const getRoomUnreadCount = (room) => {
    if (!currentUser || !room || !room.unreadCount) return 0;
    return room.unreadCount[currentUser.uid] || 0;
  };
  
  // 獲取聊天室資訊
  useEffect(() => {
    const fetchRoom = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const roomRef = doc(db, 'chats', roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
          console.error('找不到聊天室');
          navigate('/');
          return;
        }
        
        const roomData = roomSnap.data();
        setRoom(roomData);
        
        // 找出其他用戶的名稱
        if (roomData.participantNames) {
          const otherUserId = roomData.participants.find(id => id !== currentUser.uid);
          setOtherUserName(roomData.participantNames[otherUserId] || '未知用戶');
        }
        
      } catch (error) {
        console.error('獲取聊天室錯誤', error);
      }
    };
    
    fetchRoom();
  }, [roomId, currentUser, navigate]);
  
  // 監聽訊息
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (currentUser && roomId) {
      unsubscribe = listenToMessages(roomId, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      });
    }
    
    return () => unsubscribe();
  }, [roomId, currentUser]);
  
  // 記錄滾動位置
  const updateScrollPosition = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    scrollPositionRef.current = {
      top: scrollTop,
      height: scrollHeight,
      clientHeight: clientHeight,
      atBottom: scrollHeight - scrollTop - clientHeight < 50
    };
  }, []);
  
  // 處理滾動事件
  const handleScroll = useCallback(() => {
    updateScrollPosition();
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const { top, height, clientHeight } = scrollPositionRef.current;
      const isNearBottom = height - top - clientHeight < 50;
      
      setShouldAutoScroll(isNearBottom);
    }, 50);
  }, [updateScrollPosition]);
  
  // 滾動到底部的函數
  const scrollToBottom = useCallback((behavior = 'auto') => {
    if (!messagesContainerRef.current) return;
    
    requestAnimationFrame(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ 
          behavior, 
          block: 'end' 
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      
      isScrollingRef.current = false;
    });
  }, []);
  
  // 處理消息變化引起的滾動行為
  useEffect(() => {
    if (messages.length === 0 || loading) return;
    
    const isNewMessage = messages.length > prevMessagesLength;
    setPrevMessagesLength(messages.length);
    
    if (isNewMessage) {
      const lastMessage = messages[messages.length - 1];
      const isCurrentUserMessage = lastMessage.sender === currentUser?.uid;
      
      if (isCurrentUserMessage || shouldAutoScroll) {
        scrollToBottom(isCurrentUserMessage ? 'auto' : 'smooth');
      }
    } else if (shouldAutoScroll) {
      scrollToBottom('auto');
    }
  }, [messages, loading, shouldAutoScroll, prevMessagesLength, currentUser, scrollToBottom]);
  
  // 組件卸載時清理定時器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // 發送消息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;
    
    try {
      const messageToSend = newMessage.trim();
      setNewMessage('');
      
      setShouldAutoScroll(true);
      
      await sendMessage(roomId, messageToSend);
    } catch (error) {
      console.error('發送消息錯誤', error);
      alert('發送消息失敗: ' + error.message);
    }
  };
  
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
  
  // 判斷是否顯示日期分隔線
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg || !currentMsg.timestamp || !prevMsg.timestamp) return false;
    
    const currentDate = new Date(currentMsg.timestamp.seconds * 1000).toDateString();
    const prevDate = new Date(prevMsg.timestamp.seconds * 1000).toDateString();
    
    return currentDate !== prevDate;
  };
  
  // 獲取日期分隔線文字
  const getDateSeparatorText = (message) => {
    if (!message.timestamp) return '';
    
    const date = new Date(message.timestamp.seconds * 1000);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // 處理聊天室點擊
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };
  
  // 返回按鈕
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        p: 0,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 頂部導航欄 */}
      <AppBar position="static" sx={{ bgcolor: '#1976d2', boxShadow: 'none' }}>
        <Toolbar sx={{ minHeight: '56px', p: 0 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ ml: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ ml: 1, fontSize: '1.1rem', fontWeight: 500 }}>
            {room && otherUserName ? otherUserName : '訊息'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* 主要內容區 */}
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* 左側聊天室列表 */}
        <Grid item xs={12} sm={3} md={2.5} sx={{ 
          height: '100%', 
          borderRight: '1px solid', 
          borderColor: 'divider',
          display: { xs: room ? 'none' : 'flex', sm: 'flex' },
          flexDirection: 'column',
          p: 0
        }}>
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%', 
              overflowY: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 0,
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              }
            }}
          >
            {loadingRooms ? (
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
              <List sx={{ p: 0 }}>
                {chatRooms.map((room) => {
                  const otherUserName = getOtherUserName(room);
                  const unreadCount = getRoomUnreadCount(room);
                  const isActive = room.id === roomId;
                  
                  return (
                    <ListItem 
                      key={room.id}
                      button 
                      onClick={() => handleRoomClick(room.id)}
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
                          >
                            {otherUserName.charAt(0).toUpperCase()}
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
                            {formatTime(room.lastMessageTime)}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* 右側聊天內容 */}
        <Grid item xs={12} sm={9} md={10.5} sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          p: 0,
          width: { xs: '100%', sm: '75%' }
        }}>
          {!roomId || !room ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              bgcolor: 'background.default'
            }}>
              <Typography color="text.secondary">
                選擇一個聊天室來開始對話
              </Typography>
            </Box>
          ) : (
            <>
              {/* 聊天室頂部信息 */}
              <Box sx={{ 
                px: 2, 
                py: 1.5,
                borderBottom: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <Avatar sx={{ 
                  mr: 2, 
                  bgcolor: '#1976d2',
                  width: 48,
                  height: 48
                }}>
                  {otherUserName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                    {otherUserName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {room?.productName || '商品討論'}
                  </Typography>
                </Box>
              </Box>
              
              {/* 消息容器 */}
              <Paper 
                elevation={0}
                sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto',
                  p: 2,
                  px: { xs: 1, sm: 2, md: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.default',
                  position: 'relative',
                  minHeight: 0,
                  borderRadius: 0,
                  willChange: 'transform',
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                  }
                }}
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">
                      沒有消息，開始聊天吧！
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    width: '100%',
                    height: 'auto',
                    minHeight: 0,
                    flex: '1 1 auto',
                    pb: 2,
                    mx: 'auto',
                    maxWidth: { xs: '100%', sm: '96%', md: '94%', lg: '92%' }
                  }}>
                    {messages.map((message, index) => {
                      const isCurrentUser = message.sender === currentUser?.uid;
                      const prevMessage = index > 0 ? messages[index - 1] : null;
                      const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
                      
                      return (
                        <React.Fragment key={message.id || index}>
                          {/* 日期分隔線 */}
                          {showDateSeparator && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                my: 2,
                                flex: '0 0 auto'
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  bgcolor: 'background.paper', 
                                  px: 2, 
                                  py: 0.5, 
                                  borderRadius: 4,
                                  color: 'text.secondary'
                                }}
                              >
                                {getDateSeparatorText(message)}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* 消息氣泡 */}
                          <Box
                            ref={index === messages.length - 1 ? lastMessageRef : null}
                            sx={{
                              display: 'flex',
                              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                              mb: 0.75,
                              position: 'relative',
                              flex: '0 0 auto',
                              width: '100%',
                              transformOrigin: isCurrentUser ? 'right' : 'left',
                              px: { xs: 0.5, sm: 0.5 }
                            }}
                          >
                            {!isCurrentUser && (
                              <Avatar 
                                sx={{ 
                                  width: 28, 
                                  height: 28, 
                                  mr: 0.75, 
                                  mt: 0.5,
                                  bgcolor: 'grey.400',
                                  display: { xs: 'block', sm: 'block' }
                                }}
                              >
                                {message.senderName?.charAt(0).toUpperCase() || '?'}
                              </Avatar>
                            )}
                            
                            <Box sx={{ 
                              maxWidth: { xs: '90%', sm: '85%', md: '80%' },
                              minWidth: isCurrentUser ? '80px' : '60px',
                            }}>
                              {/* 發送者名稱 */}
                              {!isCurrentUser && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ ml: 1, color: 'text.secondary', display: 'none' }}
                                >
                                  {message.senderName || '未知用戶'}
                                </Typography>
                              )}
                              
                              {/* 消息內容 */}
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.25,
                                  width: 'auto',
                                  borderRadius: 3,
                                  bgcolor: isCurrentUser ? '#1976d2' : 'background.paper',
                                  color: isCurrentUser ? 'white' : 'text.primary',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  maxWidth: '100%',
                                  fontSize: { xs: '0.95rem', sm: '0.95rem' }
                                }}
                              >
                                <Typography variant="body1" sx={{ lineHeight: 1.4, margin: 0 }}>
                                  {message.text}
                                </Typography>
                              </Paper>
                              
                              {/* 時間和已讀狀態 */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                                  alignItems: 'center',
                                  mt: 0.25,
                                  gap: 0.5
                                }}
                              >
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '0.65rem'
                                  }}
                                >
                                  {formatTime(message.timestamp)}
                                </Typography>
                                
                                {isCurrentUser && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: message.read ? 'success.main' : 'text.secondary',
                                      fontSize: '0.65rem',
                                      display: { xs: 'none', sm: 'inline' }
                                    }}
                                  >
                                    {message.read ? '已讀' : '未讀'}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </React.Fragment>
                      );
                    })}
                  </Box>
                )}
              </Paper>
              
              {/* 消息輸入框 */}
              <Paper 
                component="form" 
                onSubmit={handleSendMessage}
                sx={{ 
                  p: 1, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  flex: '0 0 auto',
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: 0,
                  bgcolor: 'white'
                }}
                elevation={0}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="輸入消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  multiline
                  maxRows={3}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                      bgcolor: '#f0f2f5'
                    }
                  }}
                  size="small"
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={!newMessage.trim()}
                  sx={{ 
                    borderRadius: '50%',
                    minWidth: '36px',
                    width: '36px',
                    height: '36px',
                    p: 0,
                    ml: 1,
                    bgcolor: !newMessage.trim() ? '#e0e0e0' : '#1976d2',
                    color: 'white',
                    '&:hover': {
                      bgcolor: !newMessage.trim() ? '#d5d5d5' : '#1565c0'
                    }
                  }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChatRoom; 
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
import { getUserData } from '../services/chatService';
import MessageItem from '../components/MessageItem';
import ChatRoomItem from '../components/ChatRoomItem';

const ChatRoom = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [otherUserName, setOtherUserName] = useState('');
  const [otherUserAvatar, setOtherUserAvatar] = useState('');
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
  
  // 獲取指定聊天室的對方用戶名稱和頭像
  useEffect(() => {
    const fetchOtherUserInfo = async () => {
      if (!room || !currentUser) return;
      
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
  
  // 獲取聊天室的未讀消息數
  const getRoomUnreadCount = (room) => {
    if (!currentUser || !room || !room.unreadCount) return 0;
    return room.unreadCount[currentUser.uid] || 0;
  };
  
  // 獲取聊天室對方的用戶名稱
  const getOtherUserName = (room) => {
    if (!currentUser || !room || !room.participantNames) return '未知用戶';
    
    for (const [userId, name] of Object.entries(room.participantNames)) {
      if (userId !== currentUser.uid) {
        return name || '未知用戶';
      }
    }
    
    return '未知用戶';
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
        
      } catch (error) {
        console.error('獲取聊天室錯誤', error);
      }
    };
    
    fetchRoom();
  }, [roomId, currentUser, navigate]);
  
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
  
  // 添加防抖函數
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 監聽消息
  useEffect(() => {
    if (!roomId || !currentUser) return;
    
    setLoading(true);
    const unsubscribe = listenToMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      setMessages([]);
      setLoading(true);
    };
  }, [roomId, currentUser]);
  
  // 使用 useMemo 優化訊息列表
  const memoizedMessages = useMemo(() => {
    return messages.map(message => (
      <MessageItem 
        key={message.id} 
        message={message} 
        currentUser={currentUser} 
      />
    ));
  }, [messages, currentUser]);
  
  // 優化滾動處理
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    if (isNearBottom !== shouldAutoScroll) {
      setShouldAutoScroll(isNearBottom);
    }
  }, [shouldAutoScroll]);
  
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
  
  // 使用 useCallback 優化滾動到底部函數
  const scrollToBottom = useCallback((behavior = 'auto') => {
    if (!messagesContainerRef.current || isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    
    requestAnimationFrame(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ 
          behavior, 
          block: 'end' 
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
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
      
      // 發送消息到服務器
      await sendMessage(roomId, messageToSend);
      
      // 重置消息列表狀態
      setMessages([]);
      setLoading(true);
      
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
  
  // 處理聊天室點擊
  const handleRoomClick = (newRoomId) => {
    // 重置所有狀態
    setMessages([]);
    setLoading(true);
    setRoom(null);
    setOtherUserName('');
    setOtherUserAvatar('');
    setNewMessage('');
    
    // 導航到新聊天室
    navigate(`/chat/${newRoomId}`);
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
        bgcolor: '#f5f7fb'
      }}
    >
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'white', 
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                bgcolor: 'primary.main',
                mr: 1.5
              }}
              src={otherUserAvatar}
            >
              {!otherUserAvatar && (otherUserName?.charAt(0).toUpperCase() || '?')}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
                {otherUserName || '訊息'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {room?.lastActive ? `最後上線 ${formatTime(room.lastActive)}` : '離線'}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 主要內容區域 */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex',
        overflow: 'hidden',
        bgcolor: '#f5f7fb'
      }}>
        {/* 左側聊天室列表 */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', sm: 320 },
            display: { xs: room ? 'none' : 'block', sm: 'block' },
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white',
            overflow: 'hidden'
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
              {chatRooms.map((room) => (
                <ChatRoomItem
                  key={room.id}
                  room={room}
                  currentUser={currentUser}
                  onClick={() => handleRoomClick(room.id)}
                  isActive={room.id === roomId}
                />
              ))}
            </List>
          )}
        </Paper>

        {/* 右側聊天內容 */}
        <Box sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Paper
            ref={messagesContainerRef}
            onScroll={handleScroll}
            elevation={0}
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              p: 3,
              bgcolor: '#f5f7fb',
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '3px'
              }
            }}
          >
            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%' 
              }}>
                <CircularProgress size={40} />
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">
                  沒有消息，開始聊天吧！
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxWidth: 800, width: '100%', mx: 'auto' }}>
                {memoizedMessages}
              </Box>
            )}
          </Paper>

          {/* 輸入框區域 */}
          <Paper
            component="form"
            onSubmit={handleSendMessage}
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'white',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ 
              display: 'flex',
              alignItems: 'flex-end',
              gap: 1
            }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="輸入訊息..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: '#f5f7fb',
                    '&:hover': {
                      bgcolor: '#f0f2f5'
                    }
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                variant="contained"
                sx={{
                  minWidth: 'unset',
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  p: 0
                }}
              >
                <SendIcon />
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default ChatRoom; 
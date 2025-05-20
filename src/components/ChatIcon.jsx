import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { getUnreadMessagesCount } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

const ChatIconComponent = () => {
  console.log('ChatIconComponent 正在渲染');
  
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    console.log('ChatIconComponent useEffect 執行, currentUser:', currentUser?.uid);
    let unsubscribeUnreadCount = () => {};

    if (currentUser) {
      // 訂閱未讀消息數量變化
      unsubscribeUnreadCount = getUnreadMessagesCount((count) => {
        console.log('獲取到未讀消息數量:', count);
        setUnreadCount(count);
      });
    } else {
      setUnreadCount(0);
    }

    return () => {
      unsubscribeUnreadCount();
    };
  }, [currentUser]);

  const handleClick = () => {
    console.log('聊天圖標被點擊');
    if (!currentUser) {
      console.log('用戶未登入，重定向到登入頁面');
      navigate('/login');
      return;
    }
    console.log('導航到聊天列表頁面: /chats');
    navigate('/chats');
  };

  return (
    <IconButton
      onClick={handleClick}
      color="inherit"
      aria-label="聊天"
      title="我的消息"
    >
      <Badge badgeContent={unreadCount} color="error">
        <ChatIcon />
      </Badge>
    </IconButton>
  );
};

export default ChatIconComponent; 
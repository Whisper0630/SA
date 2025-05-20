import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createOrGetChatRoom } from '../services/chatService';

// 此元件用於創建或打開與特定用戶的聊天
const StartChatButton = ({ userId, userName, variant = 'contained', fullWidth = false, showIcon = true, productId = '', productName = '' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleStartChat = async () => {
    console.log('聯絡賣家按鈕被點擊:', { userId, userName, productId, productName });
    
    if (!currentUser) {
      console.log('用戶未登入，導向登入頁面');
      navigate('/login');
      return;
    }

    // 不能和自己聊天
    if (userId === currentUser.uid) {
      console.log('不能與自己聊天');
      setError('不能與自己聊天');
      return;
    }

    try {
      setLoading(true);
      console.log('開始創建/獲取聊天室');
      const chatRoom = await createOrGetChatRoom(userId, userName);
      console.log('聊天室創建/獲取成功:', chatRoom);
      
      // 確保 chatRoom 有 id
      if (!chatRoom || !chatRoom.id) {
        throw new Error('聊天室創建失敗，未獲得有效 ID');
      }
      
      const chatUrl = `/chat/${chatRoom.id}`;
      console.log('準備跳轉到:', chatUrl);
      
      // 使用導航跳轉
      navigate(chatUrl);
    } catch (error) {
      console.error('無法創建聊天室:', error);
      
      // 處理權限錯誤
      if (error.message && (
          error.message.includes('permission') || 
          error.message.includes('permissions') || 
          error.message.includes('unauthorized') ||
          error.message.includes('Missing or insufficient permissions')
        )) {
        console.log('Firebase 權限錯誤');
        setPermissionError(true);
      } else {
        setError(error.message || '無法創建聊天室，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClosePermissionDialog = () => {
    setPermissionError(false);
  };

  return (
    <>
      <Button
        variant={variant}
        color="primary"
        onClick={handleStartChat}
        disabled={loading || userId === currentUser?.uid}
        fullWidth={fullWidth}
        startIcon={showIcon ? (loading ? <CircularProgress size={20} /> : <ChatIcon />) : null}
      >
        {loading ? '處理中...' : '聯絡賣家'}
      </Button>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* Firebase 權限錯誤對話框 */}
      <Dialog
        open={permissionError}
        onClose={handleClosePermissionDialog}
      >
        <DialogTitle>
          {"權限錯誤"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            系統無法創建聊天室，這可能是因為 Firebase 安全規則配置的問題。請確認您已登入且擁有適當的權限。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog} color="primary">
            了解
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StartChatButton; 
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// 通用錯誤處理
const handleFirebaseError = (error) => {
  console.error('Firebase 錯誤:', error);
  
  if (error.code) {
    // 處理具體錯誤碼
    switch(error.code) {
      case 'permission-denied':
      case 'PERMISSION_DENIED':
        throw new Error('Missing or insufficient permissions');
      case 'unavailable':
        throw new Error('Firebase 服務暫時不可用，請稍後再試');
      case 'unauthenticated':
      case 'UNAUTHENTICATED':
        throw new Error('用戶未登入或登入狀態已失效');
      default:
        throw error;
    }
  } else {
    throw error;
  }
};

// 創建或獲取用戶間的聊天室
export const createOrGetChatRoom = async (otherUserId, otherUserName) => {
  try {
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }

    const currentUserId = auth.currentUser.uid;
    const currentUserName = auth.currentUser.displayName || '未命名用戶';

    // 檢查是否已存在聊天室
    const chatRoomsRef = collection(db, 'chats');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', currentUserId)
    );

    const querySnapshot = await getDocs(q);
    let chatRoom = null;
    
    // 為了除錯，記錄找到的所有匹配聊天室
    const matchingRooms = [];

    // 找出包含這兩位用戶的聊天室
    querySnapshot.forEach((doc) => {
      const room = doc.data();
      if (room.participants && room.participants.includes(otherUserId)) {
        chatRoom = { ...room, id: doc.id };
        matchingRooms.push({ id: doc.id, data: room });
      }
    });
    
    // 如果找到多個匹配的聊天室，刪除多餘的聊天室
    if (matchingRooms.length > 1) {
      console.log('找到多個匹配的聊天室，將保留最新的一個', matchingRooms);
      
      // 按創建時間排序，保留最新的一個
      matchingRooms.sort((a, b) => {
        if (!a.data.createdAt || !b.data.createdAt) return 0;
        return b.data.createdAt.seconds - a.data.createdAt.seconds;
      });
      
      // 設置要保留的聊天室
      chatRoom = { ...matchingRooms[0].data, id: matchingRooms[0].id };
      
      // 刪除多餘的聊天室
      try {
        const batch = writeBatch(db);
        
        for (let i = 1; i < matchingRooms.length; i++) {
          batch.delete(doc(db, 'chats', matchingRooms[i].id));
        }
        
        await batch.commit();
        console.log('已刪除多餘的聊天室');
      } catch (error) {
        console.error('刪除多餘聊天室時出錯:', error);
      }
    }

    // 如果不存在聊天室，則創建一個新的
    if (!chatRoom) {
      const newChatRoom = {
        participants: [currentUserId, otherUserId],
        participantNames: {
          [currentUserId]: currentUserName,
          [otherUserId]: otherUserName
        },
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        productId: "",
        productName: "",
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0
        }
      };

      try {
        const docRef = await addDoc(chatRoomsRef, newChatRoom);
        chatRoom = { ...newChatRoom, id: docRef.id };
      } catch (error) {
        return handleFirebaseError(error);
      }
    }

    return chatRoom;
  } catch (error) {
    return handleFirebaseError(error);
  }
};

// 發送消息
export const sendMessage = async (roomId, text) => {
  try {
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }

    const currentUserId = auth.currentUser.uid;
    const currentUserName = auth.currentUser.displayName || '未命名用戶';

    // 獲取聊天室資訊，以獲取另一位用戶的ID
    const chatRef = doc(db, 'chats', roomId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error('找不到此聊天室');
    }
    
    const chatData = chatSnap.data();
    const otherUserId = chatData.participants.find(id => id !== currentUserId);
    
    // 創建消息
    const message = {
      text,
      sender: currentUserId,
      senderName: currentUserName,
      timestamp: serverTimestamp(),
      read: false
    };

    // 將消息添加到集合中
    const messagesRef = collection(db, 'chats', roomId, 'messages');
    const docRef = await addDoc(messagesRef, message);

    // 更新聊天室的最後一條消息和未讀數量
    const unreadCountUpdate = {};
    unreadCountUpdate[`unreadCount.${otherUserId}`] = (chatData.unreadCount?.[otherUserId] || 0) + 1;
    
    await setDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      ...unreadCountUpdate
    }, { merge: true });

    return { ...message, id: docRef.id };
  } catch (error) {
    return handleFirebaseError(error);
  }
};

// 獲取用戶的所有聊天室
export const getUserChatRooms = (callback) => {
  try {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }

    const currentUserId = auth.currentUser.uid;
    const chatRoomsRef = collection(db, 'chats');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', currentUserId)
    );

    return onSnapshot(q, (snapshot) => {
      const rooms = [];
      const seenParticipantPairs = new Set(); // 用於確保相同參與者只顯示一個聊天室
      
      snapshot.forEach((doc) => {
        const roomData = doc.data();
        
        // 如果沒有參與者或參與者少於2人，跳過
        if (!roomData.participants || roomData.participants.length < 2) {
          return;
        }
        
        // 創建唯一識別符，按排序後的 uid 組合
        const participantsSorted = [...roomData.participants].sort();
        const pairKey = participantsSorted.join('_');
        
        // 如果這個組合已經見過，跳過 (避免重複顯示)
        if (seenParticipantPairs.has(pairKey)) {
          return;
        }
        
        seenParticipantPairs.add(pairKey);
        rooms.push({ ...roomData, id: doc.id });
      });
      
      // 按照最後消息時間排序
      rooms.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.seconds - a.lastMessageTime.seconds;
      });
      
      callback(rooms);
    }, (error) => {
      console.error('獲取聊天室錯誤', error);
      callback([]);
    });
  } catch (error) {
    console.error('獲取聊天室錯誤', error);
    callback([]);
    return () => {};
  }
};

// 監聽聊天室消息
export const listenToMessages = (roomId, callback) => {
  try {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }
    
    const currentUserId = auth.currentUser.uid;
    const messagesRef = collection(db, 'chats', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    // 連接並接收消息
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      const unreadMessageIds = [];
      
      snapshot.forEach((doc) => {
        const message = { ...doc.data(), id: doc.id };
        messages.push(message);
        
        // 檢查是否為未讀消息且不是自己發送的
        if (message.sender !== currentUserId && message.timestamp && !message.read) {
          unreadMessageIds.push(doc.id);
        }
      });
      
      callback(messages);
      
      // 如果有未讀消息，則標記為已讀
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(roomId, unreadMessageIds);
      }
    }, (error) => {
      console.error('監聽消息錯誤', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('監聽消息錯誤', error);
    callback([]);
    return () => {};
  }
};

// 標記消息為已讀
export const markMessagesAsRead = async (roomId, messageIds) => {
  try {
    if (!auth.currentUser || !messageIds || messageIds.length === 0) return;
    
    const currentUserId = auth.currentUser.uid;
    const batch = writeBatch(db);
    
    // 使用批次更新提高效率
    for (const messageId of messageIds) {
      const messageRef = doc(db, 'chats', roomId, 'messages', messageId);
      batch.update(messageRef, { read: true });
    }
    
    // 提交批次更新
    await batch.commit();
    
    // 重置未讀計數
    const chatRef = doc(db, 'chats', roomId);
    const updateData = {};
    updateData[`unreadCount.${currentUserId}`] = 0;
    await setDoc(chatRef, updateData, { merge: true });
    
  } catch (error) {
    console.error('標記已讀錯誤', error);
  }
};

// 獲取未讀消息數量
export const getUnreadMessagesCount = (callback) => {
  try {
    if (!auth.currentUser) {
      callback(0);
      return () => {};
    }

    const currentUserId = auth.currentUser.uid;
    const chatRoomsRef = collection(db, 'chats');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', currentUserId)
    );

    return onSnapshot(q, (snapshot) => {
      let totalUnread = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.unreadCount && data.unreadCount[currentUserId]) {
          totalUnread += data.unreadCount[currentUserId];
        }
      });
      
      callback(totalUnread);
    }, (error) => {
      console.error('監聽聊天室錯誤', error);
      callback(0);
    });
  } catch (error) {
    console.error('獲取未讀消息數量錯誤', error);
    callback(0);
    return () => {};
  }
};

// 獲取用戶資料
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('獲取用戶資料錯誤', error);
    return null;
  }
}; 
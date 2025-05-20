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
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// 通用錯誤處理
const handleFirebaseError = (error) => {
  console.error('Firebase 錯誤:', error);
  
  if (error.code) {
    switch(error.code) {
      case 'permission-denied':
      case 'PERMISSION_DENIED':
        throw new Error('缺少權限或權限不足');
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

// 創建新訂單
export const createOrder = async (orderData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }

    // 獲取商品信息並檢查庫存
    const productRef = doc(db, 'products', orderData.productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('商品不存在');
    }

    const product = productSnap.data();
    if (product.stock < 1) {
      throw new Error('商品庫存不足');
    }

    // 創建訂單
    const order = {
      ...orderData,
      buyerId: auth.currentUser.uid,
      buyerName: auth.currentUser.displayName || '未命名用戶',
      sellerId: orderData.sellerId,
      status: 'pending', // pending, accepted, rejected, completed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rejectionReason: '',
    };

    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, order);

    // 更新商品庫存
    await updateDoc(productRef, {
      stock: increment(-1)
    });

    return { ...order, id: docRef.id };
  } catch (error) {
    return handleFirebaseError(error);
  }
};

// 獲取用戶的所有訂單
export const getUserOrders = (callback) => {
  try {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }

    const currentUserId = auth.currentUser.uid;
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('buyerId', '==', currentUserId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ ...doc.data(), id: doc.id });
      });
      callback(orders);
    }, (error) => {
      console.error('獲取訂單錯誤', error);
      callback([]);
    });
  } catch (error) {
    console.error('獲取訂單錯誤', error);
    callback([]);
    return () => {};
  }
};

// 獲取賣家的所有訂單
export const getSellerOrders = (callback) => {
  try {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }

    const currentUserId = auth.currentUser.uid;
    console.log('當前用戶 UID:', currentUserId);
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('sellerId', '==', currentUserId),
      orderBy('createdAt', 'desc')
    );

    console.log('正在查詢賣家訂單，sellerId:', currentUserId);

    return onSnapshot(q, (snapshot) => {
      const orders = [];
      snapshot.forEach((doc) => {
        orders.push({ ...doc.data(), id: doc.id });
      });
      console.log('找到賣家訂單數量:', orders.length);
      console.log('訂單資料:', orders);
      callback(orders);
    }, (error) => {
      console.error('獲取訂單錯誤', error);
      callback([]);
    });
  } catch (error) {
    console.error('獲取訂單錯誤', error);
    callback([]);
    return () => {};
  }
};

// 更新訂單狀態
export const updateOrderStatus = async (orderId, status, rejectionReason = '') => {
  try {
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }

    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('找不到此訂單');
    }

    const orderData = orderSnap.data();
    
    // 檢查是否有權限更新訂單
    if (orderData.sellerId !== auth.currentUser.uid && orderData.buyerId !== auth.currentUser.uid) {
      throw new Error('沒有權限更新此訂單');
    }

    const updateData = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // 如果訂單被拒絕，將商品庫存加回1
    if (status === 'rejected') {
      const productRef = doc(db, 'products', orderData.productId);
      await updateDoc(productRef, {
        stock: increment(1)
      });
    }

    await updateDoc(orderRef, updateData);
    return { ...orderData, ...updateData, id: orderId };
  } catch (error) {
    return handleFirebaseError(error);
  }
};

// 獲取單個訂單詳情
export const getOrderById = async (orderId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('用戶未登入');
    }

    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('找不到此訂單');
    }

    const orderData = orderSnap.data();
    
    // 檢查是否有權限查看訂單
    if (orderData.userId !== auth.currentUser.uid && orderData.buyerId !== auth.currentUser.uid) {
      throw new Error('沒有權限查看此訂單');
    }

    return { ...orderData, id: orderId };
  } catch (error) {
    return handleFirebaseError(error);
  }
}; 
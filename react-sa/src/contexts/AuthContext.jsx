import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 處理驗證錯誤的輔助函數
  const handleAuthError = (error) => {
    console.error('認證錯誤:', error);
    
    if (!error.code) {
      return error.message || '發生未知錯誤，請稍後再試';
    }
    
    // 處理各種 Firebase Auth 錯誤代碼
    switch (error.code) {
      // 登入相關錯誤
      case 'auth/invalid-email':
        return '無效的電子郵件格式';
      case 'auth/user-disabled':
        return '此帳號已被停用';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return '帳號或密碼錯誤';
        
      // 註冊相關錯誤
      case 'auth/email-already-in-use':
        return '此電子郵件已被註冊';
      case 'auth/weak-password':
        return '密碼強度不足';
        
      // 重設密碼相關錯誤
      case 'auth/invalid-action-code':
        return '重設密碼連結無效或已過期';
        
      // 其他錯誤
      case 'auth/network-request-failed':
        return '網絡連接失敗，請檢查您的網絡連接';
      case 'auth/too-many-requests':
        return '由於多次嘗試失敗，帳號暫時被鎖定，請稍後再試';
      default:
        return `錯誤: ${error.message || '未知錯誤，請稍後再試'}`;
    }
  };

  // 表單驗證的輔助函數
  const validateEmail = (email) => {
    if (!email.trim()) {
      return '請輸入電子郵件';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '請輸入有效的電子郵件格式';
    }
    
    return '';
  };
  
  const validatePassword = (password) => {
    if (!password) {
      return '請輸入密碼';
    }
    
    if (password.length < 6) {
      return '密碼長度至少需要6個字符';
    }
    
    return '';
  };

  // 註冊新用戶
  const signup = async (email, password, name) => {
    try {
      // 在開始註冊前先清除任何舊的錯誤
      setError('');
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 更新用戶資料
      await updateProfile(user, {
        displayName: name
      });
      
      // 將用戶資料存入Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: name,
        email: user.email,
        createdAt: serverTimestamp(), // 使用服務器時間戳
        lastLogin: serverTimestamp(),
        role: 'user', // 預設角色
        status: 'active', // 用戶狀態
        phoneNumber: '',
        photoURL: '',
      });
      
      console.log('用戶資料已成功存入Firestore');
      
      // 註冊後立即登出用戶，防止自動登入
      await signOut(auth);
      
      return user;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw { ...error, message: errorMessage };
    }
  };

  // 登入
  const login = async (email, password) => {
    try {
      // 在開始登入前清除錯誤
      setError('');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 更新最後登入時間
      try {
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      } catch (updateError) {
        console.error('更新登入時間失敗:', updateError);
      }
      
      return user;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw { ...error, message: errorMessage };
    }
  };

  // 登出
  const logout = async () => {
    try {
      setError('');
      await signOut(auth);
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw { ...error, message: errorMessage };
    }
  };

  // 重設密碼
  const resetPassword = async (email) => {
    try {
      const emailValidationError = validateEmail(email);
      if (emailValidationError) {
        setError(emailValidationError);
        throw new Error(emailValidationError);
      }
      
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const errorMessage = error.message ? handleAuthError(error) : error.message;
      setError(errorMessage);
      throw { ...error, message: errorMessage };
    }
  };

  // 獲取用戶資料
  const getUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw { ...error, message: errorMessage };
    }
  };

  // 更新用戶資料
  const updateUserData = async (uid, data) => {
    try {
      // 更新 Firestore 中的用戶資料
      await setDoc(doc(db, 'users', uid), data, { merge: true });
      
      // 如果有 displayName 或 photoURL，同時更新 Firebase Auth 中的用戶資料
      if (auth.currentUser && (data.displayName !== undefined || data.photoURL !== undefined)) {
        const authUpdateData = {};
        if (data.displayName !== undefined) {
          authUpdateData.displayName = data.displayName;
        }
        
        // 處理頭像更新 - 檢查是否為 base64 格式
        if (data.photoURL !== undefined) {
          // 檢查 photoURL 是否為 base64 格式（以 data:image 開頭）
          if (data.photoURL && !data.photoURL.startsWith('data:image')) {
            // 非 base64 格式才更新到 Auth
            authUpdateData.photoURL = data.photoURL;
          } else {
            console.log('頭像為 base64 格式，僅保存在 Firestore 中');
          }
        }
        
        // 只有在有需要更新的資料時才調用 updateProfile
        if (Object.keys(authUpdateData).length > 0) {
          await updateProfile(auth.currentUser, authUpdateData);
          // 觸發 currentUser 更新，確保導航欄等使用 currentUser 的組件能獲取最新資料
          setCurrentUser({ ...auth.currentUser });
        }
      }
      
      return true;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      throw { ...error, message: errorMessage };
    }
  };

  // 監聽用戶登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    getUserData,
    updateUserData,
    validateEmail,
    validatePassword,
    error,
    loading,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
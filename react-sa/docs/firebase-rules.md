# Firebase 安全規則配置

為了讓聊天功能正常工作，您需要在 Firebase 控制台中配置正確的安全規則。以下是推薦的 Firestore 安全規則配置。

## Firestore 安全規則

請在 Firebase 控制台中的 Firestore 數據庫 > 規則標籤下，將現有規則替換為以下內容：

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶資料：只有自己可以修改自己的資料，但所有登入用戶可以讀取
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 商品相關：任何登入用戶可以讀取，只有創建者可以修改
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 聊天室：只有參與者可以讀寫
    match /chatRooms/{roomId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null && 
                     (resource.data.participants.hasAny([request.auth.uid]) ||
                      request.resource.data.participants.hasAny([request.auth.uid]));
      
      // 聊天訊息：只有參與者可以讀寫
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
                            get(/databases/$(database)/documents/chatRooms/$(roomId)).data.participants.hasAny([request.auth.uid]);
      }
    }
    
    // 購物車：只有自己可以讀寫自己的購物車
    match /carts/{cartId} {
      allow read, write: if request.auth != null && request.auth.uid == cartId;
    }
    
    // 訂單：只有相關用戶可以讀取，只有自己可以創建
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                   (resource.data.buyerId == request.auth.uid || resource.data.sellerId == request.auth.uid);
      allow create: if request.auth != null && request.resource.data.buyerId == request.auth.uid;
      allow update: if request.auth != null && 
                     (resource.data.buyerId == request.auth.uid || resource.data.sellerId == request.auth.uid);
    }
  }
}
```

## 解決權限問題的步驟

1. 登入 [Firebase 控制台](https://console.firebase.google.com/)
2. 選擇您的專案 (sasb-f7ff8)
3. 在左側導航欄中選擇 "Firestore Database"
4. 點擊 "Rules" 標籤
5. 替換現有規則為上述規則
6. 點擊 "Publish" 發布規則

## 臨時解決方案

如果您現在無法更新 Firebase 安全規則，您可以暫時設置一個更寬鬆的安全規則來測試功能（注意：這只適用於開發環境，不建議在生產環境中使用）：

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

這將允許任何已登入的用戶讀寫任何數據，但至少可以讓聊天功能暫時工作。

## 其他可能的問題

如果更新安全規則後仍然出現權限問題，請檢查：

1. 用戶是否已正確登入 - 查看控制台中的 `auth.currentUser` 是否有值
2. 數據庫路徑是否正確 - 確保集合和文檔 ID 拼寫正確
3. 索引是否已創建 - 複雜查詢可能需要創建複合索引

## 索引配置

對於聊天功能，您可能需要創建以下索引：

1. 集合: `chatRooms`
   - 欄位: `participants` (Array) ASCENDING, `lastMessage.timestamp` (Map) DESCENDING

2. 集合: `chatRooms/{roomId}/messages`
   - 欄位: `timestamp` (Timestamp) ASCENDING

在 Firebase 控制台的 Firestore 數據庫 > 索引標籤下創建這些索引，或者直接點擊控制台中的錯誤訊息中提供的鏈接來創建所需的索引。 
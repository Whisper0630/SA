import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';

// 組件
import Navbar from './components/Navbar';
import CategoryBar from './components/CategoryBar';
import Footer from './components/Footer';

// 頁面
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import ProductDetail from './pages/ProductDetail';
import AddProduct from './pages/AddProduct';
import CategoryPage from './pages/CategoryPage';
import MyProducts from './pages/MyProducts';
import SearchResults from './pages/SearchResults';
import EditProduct from './pages/EditProduct';
import DeleteProduct from './pages/DeleteProduct';
import Cart from './pages/Cart';
import ChatRoom from './pages/ChatRoom';
import ChatRoomList from './pages/ChatRoomList';
import ChatRoomPage from './pages/ChatRoomPage';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Giveaway from './pages/Giveaway';

// 創建主題
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

// 路由包裝器，用於存取location物件
const AppRouter = () => {
  const location = useLocation();
  const [currentCategory, setCurrentCategory] = useState('all');
  const showCategoryBar = !location.pathname.startsWith('/chat/') && !location.pathname.startsWith('/chats') && !location.pathname.startsWith('/chat-test');
  
  console.log('當前路徑:', location.pathname);
  
  // 從URL更新當前分類
  useEffect(() => {
    // 首頁
    if (location.pathname === '/') {
      setCurrentCategory('all');
      return;
    }
    
    // 分類頁面
    if (location.pathname.startsWith('/category/')) {
      const category = decodeURIComponent(location.pathname.split('/category/')[1]);
      setCurrentCategory(category);
      return;
    }
  }, [location.pathname]);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {showCategoryBar && <CategoryBar currentCategory={currentCategory} />}
      <main style={{ flexGrow: 1 }}>
        <Routes>
          <Route 
            path="/" 
            element={<Home currentCategory={currentCategory} />} 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/edit-product/:id" element={<EditProduct />} />
          <Route path="/delete-product/:id" element={<DeleteProduct />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
          <Route path="/chats" element={<ChatRoomList />} />
          <Route path="/chat-test" element={<ChatRoomPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/giveaway" element={<Giveaway />} />
          <Route path="/giveaway/:category" element={<Giveaway />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <Router>
              <AppRouter />
            </Router>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useOrder } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/Orders.css';

const OrderCard = ({ order, onUpdateStatus }) => {
  const { currentUser } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setRejectionReason('');
  };

  const handleReject = async () => {
    await onUpdateStatus(order.id, 'rejected', rejectionReason);
    handleCloseDialog();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'accepted':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'completed':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '待處理';
      case 'accepted':
        return '已接受';
      case 'rejected':
        return '已拒絕';
      case 'completed':
        return '已完成';
      default:
        return '未知狀態';
    }
  };
  
  if (!order) return null;
  const isSeller = currentUser && currentUser.uid === order.sellerId;

  return (
    <Paper elevation={3} className="order-card">
      <Box p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              訂單編號: {order.id}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>商品名稱:</strong> {order.productName}
            </Typography>
            {order.date && order.time && (
              <Typography variant="body1">
                <strong>交易時間:</strong> {order.date} {order.time}
              </Typography>
            )}
            <Typography variant="body1">
              <strong>價格:</strong> {order.price > 0 ? `$${order.price}` : '免費'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>買家:</strong> {order.buyerName}
            </Typography>
            <Typography variant="body1">
              <strong>賣家:</strong> {order.sellerName}
            </Typography>
            <Typography variant="body1">
              <strong>訂單狀態:</strong>
              <span style={{ 
                color: getStatusColor(order.status),
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {getStatusText(order.status)}
              </span>
            </Typography>
          </Grid>
          {order.rejectionReason && (
            <Grid item xs={12}>
              <Alert severity="error">
                拒絕原因: {order.rejectionReason}
              </Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              {isSeller && order.status === 'pending' && (
                <>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={() => onUpdateStatus(order.id, 'accepted')}
                  >
                    接受訂單
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={handleOpenDialog}
                  >
                    拒絕訂單
                  </Button>
                </>
              )}
              {!isSeller && order.status === 'accepted' && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                >
                  完成訂單
                </Button>
              )}
              {!isSeller && order.status === 'pending' && (
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => onUpdateStatus(order.id, 'rejected', '買家取消訂單')}
                >
                  取消訂單
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>拒絕訂單</DialogTitle>
        <DialogContent>
          <DialogContentText>
            請輸入拒絕此訂單的原因：
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="拒絕原因"
            type="text"
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleReject} color="error">
            確認拒絕
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

const Orders = () => {
  const { orders, sellerOrders, loading, error, updateOrder } = useOrder();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="md" className="orders-container">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" className="orders-container">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const displayOrders = tabValue === 0 ? orders : sellerOrders;

  return (
    <Container maxWidth="md" className="orders-container">
      <Typography variant="h4" component="h1" gutterBottom align="center" className="orders-title">
        我的訂單
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="我的購買" />
          <Tab label="我的銷售" />
        </Tabs>
      </Box>

      {displayOrders.length === 0 ? (
        <Paper elevation={3} className="empty-orders">
          <Typography variant="h6" align="center" className="empty-orders-text">
            {tabValue === 0 ? '您還沒有任何購買記錄' : '您還沒有任何銷售記錄'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {displayOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <OrderCard 
                order={order} 
                onUpdateStatus={updateOrder}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Orders; 
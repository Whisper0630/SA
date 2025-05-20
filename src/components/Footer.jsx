import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Link, 
  Divider,
  Grid,
  IconButton
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import '../styles/layout/Footer.css';

const Footer = () => {
  return (
    <Box 
      component="footer" 
      className="footer"
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" className="footerTitle">
              輔仁大學外宿生二手交易平台
            </Typography>
            <Typography variant="body2" className="footerDescription">
              為輔仁大學外宿生提供可靠、便捷的二手交易服務，
              讓閒置物品找到新主人，讓需求得到滿足。
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" className="footerTitle">
              快速連結
            </Typography>
            <Link href="/" className="footerLink">
              首頁
            </Link>
            <Link href="/about" className="footerLink">
              關於我們
            </Link>
            <Link href="/terms" className="footerLink">
              使用條款
            </Link>
            <Link href="/privacy" className="footerLink">
              隱私政策
            </Link>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" className="footerTitle">
              聯絡我們
            </Typography>
            <Typography variant="body2" className="footerDescription" sx={{ mb: 2 }}>
              電子郵件: contact@fjusecondhand.com
            </Typography>
            <Box className="socialIcons">
              <IconButton aria-label="facebook" className="socialIcon">
                <FacebookIcon />
              </IconButton>
              <IconButton aria-label="instagram" className="socialIcon">
                <InstagramIcon />
              </IconButton>
              <IconButton aria-label="twitter" className="socialIcon">
                <TwitterIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" className="copyright">
          {'© '}
          {new Date().getFullYear()}
          {' 輔仁大學外宿生二手交易平台. All rights reserved.'}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 
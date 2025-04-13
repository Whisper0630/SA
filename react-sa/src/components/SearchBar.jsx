import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, InputBase, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ fullWidth = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', maxWidth: '600px', mx: 'auto', my: 2 }}>
      <Paper
        component="form"
        onSubmit={handleSearch}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          border: '1px solid #e0e0e0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: '24px',
          '&:hover': {
            boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
          }
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="搜尋商品..."
          inputProps={{ 'aria-label': '搜尋商品' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default SearchBar; 
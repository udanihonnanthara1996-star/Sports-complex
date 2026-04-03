import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Paper,
  Container,
  Card,
  CardContent
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import AddItem from './AddItem';
import ItemList from './ItemList';
import AdminNav from '../Admin/AdminNav';

const Dashboard2 = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    categories: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/inventory');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const items = data.users || [];
      
      setStats({
        totalItems: items.length,
        lowStock: items.filter(item => parseInt(item.Quantity) < 10).length,
        categories: new Set(items.map(item => item.Category)).size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #43ea5e 0%, #0a0a0a 100%)',
    }}>
      <AppBar
        position="fixed"
        sx={{
          background: 'linear-gradient(90deg, #43ea5e 0%, #0a0a0a 100%)',
          color: 'white',
          boxShadow: 3,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          background: 'rgba(255,255,255,0.95)',
          color: 'black',
          borderRadius: 4,
          boxShadow: 4,
        }}
      >
        <AdminNav />
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {/* Total Items Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{
                bgcolor: 'white',
                color: 'black',
                border: '2px solid #43ea5e',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
              }}>
                <CardContent>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#43ea5e', mb: 2 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Total Items
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalItems}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Low Stock Items Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{
                bgcolor: 'white',
                color: 'black',
                border: '2px solid #43ea5e',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
              }}>
                <CardContent>
                  <WarningIcon sx={{ fontSize: 40, color: '#43ea5e', mb: 2 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4">
                    {stats.lowStock}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Categories Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{
                bgcolor: 'white',
                color: 'black',
                border: '2px solid #43ea5e',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
              }}>
                <CardContent>
                  <CategoryIcon sx={{ fontSize: 40, color: '#43ea5e', mb: 2 }} />
                  <Typography color="textSecondary" gutterBottom>
                    Total Categories
                  </Typography>
                  <Typography variant="h4">
                    {stats.categories}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Items */}
            <Grid item xs={12}>
              <Paper sx={{
                p: 2,
                bgcolor: 'white',
                color: 'black',
                border: '2px solid #43ea5e',
                borderRadius: 3,
                boxShadow: 3,
              }}>
                <Typography variant="h6" gutterBottom>
                  Inventory Management
                </Typography>
                <AddItem onItemAdded={fetchDashboardStats} />
                <ItemList />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard2;
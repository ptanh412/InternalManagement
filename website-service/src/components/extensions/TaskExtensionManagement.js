import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import {
  PendingActions as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  History as AllIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/apiService';
import ExtensionCard from './ExtensionCard';
import ExtensionReviewDialog from './ExtensionReviewDialog';

const TaskExtensionManagement = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: Pending, 1: Approved, 2: Rejected, 3: All
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    loadExtensions();
  }, [activeTab]);

  const loadExtensions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get pending extensions from API
      // Note: Backend currently only has getPendingExtensions()
      // For production, you may want to add endpoints:
      // - GET /task/extensions?status=APPROVED
      // - GET /task/extensions?status=REJECTED
      // - GET /task/extensions (all)
      
      const response = await apiService.getAllStatusExtensions();
      const allExtensions = response.result || [];
      
      // For now, we show all data in each tab since backend returns all
      // In production, this should be filtered by backend for performance
      let filteredData = allExtensions;
      
      // Client-side filtering based on active tab
      if (activeTab === 0) {
        // Pending only
        filteredData = allExtensions.filter(ext => ext.status === 'PENDING');
      } else if (activeTab === 1) {
        // Approved only
        filteredData = allExtensions.filter(ext => ext.status === 'APPROVED');
      } else if (activeTab === 2) {
        // Rejected only
        filteredData = allExtensions.filter(ext => ext.status === 'REJECTED');
      }
      // Tab 3 (All) shows everything, no filter

      setExtensions(filteredData);

      // Calculate stats from all extensions
      setStats({
        pending: allExtensions.filter(ext => ext.status === 'PENDING').length,
        approved: allExtensions.filter(ext => ext.status === 'APPROVED').length,
        rejected: allExtensions.filter(ext => ext.status === 'REJECTED').length,
        total: allExtensions.length,
      });

    } catch (err) {
      console.error('Error loading extensions:', err);
      setError(
        err.response?.data?.message || 
        'Failed to load extension requests. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenReviewDialog = (extension) => {
    setSelectedExtension(extension);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedExtension(null);
  };

  const handleReviewSubmit = async (extensionId, reviewData) => {
    try {
      // Normalize newDueDate to YYYY-MM-DD if provided as a Date object
      const payload = { ...reviewData };
      if (payload.newDueDate) {
        if (payload.newDueDate instanceof Date) {
          payload.newDueDate = payload.newDueDate.toISOString().split('T')[0];
        } else if (typeof payload.newDueDate === 'string') {
          // keep as-is (expected format YYYY-MM-DD)
        }
      }

      await apiService.reviewExtensionRequest(extensionId, payload);
      
      // Reload extensions
      await loadExtensions();
      
      handleCloseReviewDialog();
    } catch (err) {
      console.error('Error reviewing extension:', err);
      throw err; // Let dialog handle the error
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return 'PENDING';
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return status;
    }
  };

  return (
    <Container className="dark:bg-gray-900" maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="dark:text-gray-100" fontWeight="bold" gutterBottom>
          Task Extension Management
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
          View and manage deadline extension requests from employees
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dark:bg-gray-800" sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'warning.lighter', '&.dark': { bgcolor: 'rgba(255, 152, 0, 0.08)' },
              borderLeft: 4,
              borderColor: 'warning.main',
            }}
          >
            <PendingIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            <Box>
              <Typography variant="h4" className="dark:text-gray-100" fontWeight="bold">
                {stats.pending}
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                PENDING
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dark:bg-gray-800" sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'success.lighter', '&.dark': { bgcolor: 'rgba(46, 125, 50, 0.08)' },
              borderLeft: 4,
              borderColor: 'success.main',
            }}
          >
            <ApprovedIcon sx={{ fontSize: 40, color: 'success.main' }} />
            <Box>
              <Typography variant="h4" className="dark:text-gray-100" fontWeight="bold">
                {stats.approved}
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                APPROVED
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dark:bg-gray-800" sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'error.lighter', '&.dark': { bgcolor: 'rgba(211, 47, 47, 0.08)' },
              borderLeft: 4,
              borderColor: 'error.main',
            }}
          >
            <RejectedIcon sx={{ fontSize: 40, color: 'error.main' }} />
            <Box>
              <Typography variant="h4" className="dark:text-gray-100" fontWeight="bold">
                {stats.rejected}
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                REJECTED
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dark:bg-gray-800" sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'info.lighter', '&.dark': { bgcolor: 'rgba(2, 136, 209, 0.08)' },
              borderLeft: 4,
              borderColor: 'info.main',
            }}
          >
            <AllIcon sx={{ fontSize: 40, color: 'info.main' }} />
            <Box>
              <Typography variant="h4" className="dark:text-gray-100" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                Total
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper className="dark:bg-gray-800 dark:border-gray-700" sx={{ mb: 3, backgroundImage: 'none' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          // Định nghĩa màu mặc định cho Indicator (đường gạch dưới)
          indicatorColor="primary" 
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            // 1. Màu cho các Tab ở trạng thái bình thường (Light Mode)
            '& .MuiTab-root': {
              color: 'text.secondary',
              transition: 'color 0.2s',
            },
            // 2. Tác động khi hệ thống có class .dark (Dark Mode)
            '.dark & .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.6)', // Màu trắng mờ cho tab chưa active
              '&.Mui-selected': {
                color: '#fff', // Màu trắng tinh khi được chọn
              },
            },
            // 3. Đảm bảo Icon cũng đổi màu theo
            '& .MuiTab-iconWrapper': {
              marginBottom: '4px !important',
            },
          }}
        >
          <Tab
            icon={
              <Badge badgeContent={stats.pending} color="warning">
                <PendingIcon className="dark:text-amber-400" />
              </Badge>
            }
            label="PENDING"
          />
          <Tab
            icon={
              <Badge badgeContent={stats.approved} color="success">
                <ApprovedIcon className="dark:text-green-400" />
              </Badge>
            }
            label="APPROVED"
          />
          <Tab
            icon={
              <Badge badgeContent={stats.rejected} color="error">
                <RejectedIcon className="dark:text-red-400" />
              </Badge>
            }
            label="REJECTED"
          />
          <Tab
            icon={
              <Badge badgeContent={stats.total} color="info">
                <AllIcon className="dark:text-blue-400" />
              </Badge>
            }
            label="ALL"
          />
        </Tabs>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" className="dark:bg-red-900/20 dark:text-red-200" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : extensions.length === 0 ? (
        <Paper className="dark:bg-gray-800" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" className="text-gray-600 dark:text-gray-400">
            No extension requests found.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {extensions.map((extension) => (
            <Grid item xs={12} key={extension.id}>
              <ExtensionCard
                extension={extension}
                onReview={handleOpenReviewDialog}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Review Dialog */}
      {selectedExtension && (
        <ExtensionReviewDialog
          open={reviewDialogOpen}
          extension={selectedExtension}
          onClose={handleCloseReviewDialog}
          onSubmit={handleReviewSubmit}
        />
      )}
    </Container>
  );
};

export default TaskExtensionManagement;

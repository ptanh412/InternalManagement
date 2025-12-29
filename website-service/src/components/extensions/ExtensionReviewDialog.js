import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ExtensionReviewDialog = ({ open, extension, onClose, onSubmit }) => {
  const [reviewStatus, setReviewStatus] = useState('APPROVED'); // APPROVED or REJECTED
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');

  const handleStatusChange = (event, newStatus) => {
    if (newStatus !== null) {
      setReviewStatus(newStatus);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!reviewStatus) {
      setError('Please select a review decision');
      return;
    }

    if (reviewStatus === 'REJECTED' && !reviewComments.trim()) {
      setError('Please enter a reason for rejection');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Submitting review:', {
        extensionId: extension.id,
        reviewStatus,
        reviewComments,
        newDueDate,
      });
      const reviewData = {
        status: reviewStatus,
        reviewComments: reviewComments.trim() || undefined,
        // send newDueDate as YYYY-MM-DD if provided (team-lead editable)
        newDueDate: newDueDate || undefined,
      };

      await onSubmit(extension.id, reviewData);
      
      // Reset form
      setReviewStatus('APPROVED');
      setReviewComments('');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'An error occurred while processing the request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sync newDueDate state when extension prop changes
  useEffect(() => {
    if (extension && extension.newDueDate) {
      try {
        const dt = new Date(extension.newDueDate);
        // format as YYYY-MM-DD for input[type=date]
        const isoDate = dt.toISOString().split('T')[0];
        setNewDueDate(isoDate);
      } catch {
        setNewDueDate('');
      }
    } else {
      setNewDueDate('');
    }
  }, [extension]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        className: "dark:bg-gray-900 dark:text-gray-100",
        sx: {
          borderRadius: 2,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle className="dark:bg-blue-900/40" sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Review Extension Request
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Task: {extension?.taskTitle || `#${extension?.taskId}`}
        </Typography>
      </DialogTitle>

      <DialogContent className="dark:bg-gray-900" sx={{ pt: 3 }}>
        {/* Task Summary Paper */}
        <Paper 
          variant="outlined" 
          className="dark:bg-gray-800 dark:border-gray-700"
          sx={{ p: 2, mb: 3, bgcolor: 'grey.50', backgroundImage: 'none' }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                  Requested by:
                </Typography>
                <Typography variant="body1" fontWeight={600} className="dark:text-gray-200">
                  {extension?.requestedByName || extension?.requestedBy}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                  Extension hours:
                </Typography>
                <Chip label={`+${extension?.extensionHours || 0}h`} color="primary" size="small" />
              </Box>
            </Box>

            <Divider className="dark:bg-gray-700" />

            <Box>
              <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block" gutterBottom>
                Reason for extension:
              </Typography>
              <Typography variant="body2" className="dark:text-gray-300" sx={{ fontStyle: 'italic' }}>
                "{extension?.reason}"
              </Typography>
            </Box>

            <Divider className="dark:bg-gray-700" />

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                  New deadline (proposed):
                </Typography>
                <Typography variant="body2" fontWeight={700} color="success.main" className="dark:text-green-400">
                  {formatDateShort(extension?.newDueDate)}
                </Typography>
              </Box>

              <Box sx={{ minWidth: 200 }}>
                <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block" gutterBottom>
                  Edit new deadline (team-lead)
                </Typography>
                <TextField
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  size="small"
                  fullWidth
                  className="dark:bg-gray-700 rounded"
                  InputProps={{ className: "dark:text-white" }}
                />
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Review Decision Toggle */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" className="dark:text-gray-200" gutterBottom>
            Your decision: <span style={{ color: '#ff4444' }}>*</span>
          </Typography>
          <ToggleButtonGroup
            value={reviewStatus}
            exclusive
            onChange={handleStatusChange}
            fullWidth
            className="dark:bg-gray-800"
            sx={{ mt: 1 }}
          >
            <ToggleButton 
              value="APPROVED" 
              className="dark:text-gray-400 dark:border-gray-700"
              sx={{ '&.Mui-selected': { bgcolor: 'success.main', color: 'white' } }}
            >
              <ApproveIcon sx={{ mr: 1 }} /> Approve
            </ToggleButton>
            <ToggleButton 
              value="REJECTED" 
              className="dark:text-gray-400 dark:border-gray-700"
              sx={{ '&.Mui-selected': { bgcolor: 'error.main', color: 'white' } }}
            >
              <RejectIcon sx={{ mr: 1 }} /> Reject
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Review Comments */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" className="dark:text-gray-200" gutterBottom>
            Comment {reviewStatus === 'REJECTED' && <span style={{ color: '#ff4444' }}>*</span>}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter your comments..."
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            className="dark:bg-gray-800"
            InputProps={{ className: "dark:text-white" }}
            sx={{ mt: 1 }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions className="dark:bg-gray-900" sx={{ p: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} className="dark:text-gray-400" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          color={reviewStatus === 'APPROVED' ? 'success' : 'error'}
          sx={{ textTransform: 'none', minWidth: 120 }}
        >
          {submitting ? 'Processing...' : reviewStatus}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtensionReviewDialog;

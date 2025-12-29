import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Divider,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Assignment as TaskIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  TrendingUp as ExtensionIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ExtensionCard = ({ extension, onReview, getStatusColor, getStatusLabel }) => {
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

  const isPending = extension.status === 'PENDING';
  const isApproved = extension.status === 'APPROVED';
  const isRejected = extension.status === 'REJECTED';

  return (
    <Card
      className="dark:bg-gray-800 dark:border-gray-700 transition-all duration-300"
      sx={{
        borderLeft: 6,
        borderColor: `${getStatusColor(extension.status)}.main`,
        backgroundImage: 'none',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Grid container spacing={3}>
          {/* Left Section */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <TaskIcon color="primary" sx={{ mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" className="dark:text-white" gutterBottom>
                  {extension.taskTitle || `Task #${extension.taskId}`}
                </Typography>
                <Chip
                  label={getStatusLabel(extension.status)}
                  color={getStatusColor(extension.status)}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar className="dark:bg-blue-600" sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                    Requested by:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} className="dark:text-gray-200">
                    {extension.requestedByName || extension.requestedBy}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" className="dark:text-gray-500" color="action" />
                <Box>
                  <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                    Time of request:
                  </Typography>
                  <Typography variant="body2" fontWeight={500} className="dark:text-gray-300">
                    {formatDate(extension.requestedAt)}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            {/* Reason Box */}
            <Box
              className="dark:bg-gray-900/50 dark:border-l-blue-500"
              sx={{
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                borderLeft: 3,
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" className="dark:text-gray-200" gutterBottom>
                Reason for extension:
              </Typography>
              <Typography variant="body2" className="dark:text-gray-400" color="text.secondary">
                {extension.reason}
              </Typography>
            </Box>

            {/* Review Comments */}
            {extension.reviewComments && (
              <Box
                className={isApproved ? "dark:bg-green-900/20 dark:border-green-800" : "dark:bg-red-900/20 dark:border-red-800"}
                sx={{
                  mt: 2,
                  bgcolor: isApproved ? 'success.lighter' : 'error.lighter',
                  p: 2,
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: isApproved ? 'success.main' : 'error.main',
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" className="dark:text-gray-200" gutterBottom>
                  Comment by {extension.reviewedByName || 'Team Lead'}:
                </Typography>
                <Typography variant="body2" className="dark:text-gray-400" color="text.secondary">
                  {extension.reviewComments}
                </Typography>
                <Typography variant="caption" className="dark:text-gray-500" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Reviewed at: {formatDate(extension.reviewedAt)}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Right Section - Extension Details */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              className="dark:bg-blue-900/10 dark:border-blue-800/50"
              sx={{
                p: 2,
                bgcolor: 'primary.lighter',
                border: 1,
                borderColor: 'primary.light',
                backgroundImage: 'none'
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" className="dark:text-blue-300" gutterBottom sx={{ mb: 2 }}>
                <ExtensionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Extension Information
              </Typography>

              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" className="dark:text-gray-400" color="text.secondary">
                    Extension hours:
                  </Typography>
                  <Chip
                    icon={<TimeIcon />}
                    label={`+${extension.extensionHours}h`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Divider className="dark:bg-gray-700" />

                <Box>
                  <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                    Original deadline:
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="error.main" className="dark:text-red-400">
                    {formatDateShort(extension.originalDueDate || extension.currentDueDate)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                    New deadline (proposed):
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main" className="dark:text-green-400">
                    {formatDateShort(extension.newDueDate)}
                  </Typography>
                </Box>

                <Divider className="dark:bg-gray-700" />

                {/* Extension Statistics */}
                {extension.extensionCount !== undefined && (
                  <Box>
                    <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" display="block">
                      Number of extensions:
                    </Typography>
                    <Typography variant="body2" fontWeight={600} className="dark:text-gray-200">
                      {extension.extensionCount || 0} times
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>

      {isPending && (
        <>
          <Divider className="dark:bg-gray-700" />
          <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => onReview(extension)}
              className="dark:border-red-800 dark:text-red-400"
              sx={{ textTransform: 'none' }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => onReview(extension)}
              sx={{ textTransform: 'none' }}
            >
              Approve
            </Button>
          </CardActions>
        </>
      )}
    </Card>
  );
};


export default ExtensionCard;

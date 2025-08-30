import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Chip,
  Badge,
  Tooltip,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { logOut } from '../services/authenticationService';

const AdminHeader = ({ 
  userInfo, 
  darkMode, 
  onToggleDarkMode,
  onMenuToggle,
  title = "Internal Management System"
}) => {
  const theme = useTheme();
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logOut();
    window.location.href = '/login';
  };

  const handleProfile = () => {
    handleProfileMenuClose();
    window.location.href = '/profile';
  };

  const handleBackToDashboard = () => {
    window.location.href = '/';
  };

  const getUserDisplayName = () => {
    if (userInfo?.firstName && userInfo?.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    }
    return userInfo?.username || 'Admin User';
  };

  const getUserInitials = () => {
    if (userInfo?.firstName && userInfo?.lastName) {
      return `${userInfo.firstName[0]}${userInfo.lastName[0]}`;
    }
    return userInfo?.username?.[0]?.toUpperCase() || 'A';
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important', px: 3 }}>
        {/* Left Section */}
        <Box display="flex" alignItems="center" flex={1}>
          {/* Menu Toggle */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle menu"
            onClick={onMenuToggle}
            sx={{ 
              mr: 2,
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.1),
              }
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo and Title */}
          <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={handleBackToDashboard}>
            <Box
              component="img"
              src="/logo/devteria-logo.png"
              alt="Logo"
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                mr: 2,
                border: `2px solid ${alpha(theme.palette.common.white, 0.2)}`,
              }}
            />
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  lineHeight: 1.2,
                  fontSize: '1.1rem',
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.common.white, 0.8),
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                Administrator Portal
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Center Section - Admin Badge */}
        <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
          <Chip
            icon={<SecurityIcon />}
            label="ADMIN ACCESS"
            sx={{
              backgroundColor: alpha(theme.palette.warning.main, 0.9),
              color: theme.palette.warning.contrastText,
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 32,
              '& .MuiChip-icon': {
                fontSize: 16,
              },
              border: `1px solid ${alpha(theme.palette.warning.light, 0.5)}`,
              boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.3)}`,
            }}
          />
        </Box>

        {/* Right Section */}
        <Box display="flex" alignItems="center" gap={1} flex={1} justifyContent="flex-end">
          {/* Dark Mode Toggle */}
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton
              color="inherit"
              onClick={onToggleDarkMode}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                }
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                }
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Messages */}
          <Tooltip title="Messages">
            <IconButton
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                }
              }}
            >
              <Badge badgeContent={5} color="error">
                <MailIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Box display="flex" alignItems="center" ml={2}>
            <Box textAlign="right" mr={1} sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {getUserDisplayName()}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.common.white, 0.8),
                  fontSize: '0.7rem',
                }}
              >
                {userInfo?.role || 'Administrator'}
              </Typography>
            </Box>
            <Tooltip title="Account Settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0.5,
                  border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  '&:hover': {
                    border: `2px solid ${alpha(theme.palette.common.white, 0.5)}`,
                  }
                }}
              >
                <Avatar
                  src={userInfo?.avatar}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.secondary.main,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              minWidth: 240,
              mt: 1,
              borderRadius: 2,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
            }
          }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {getUserDisplayName()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userInfo?.email || 'admin@company.com'}
            </Typography>
          </Box>
          
          <Divider />
          
          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </MenuItem>
          
          <MenuItem onClick={handleBackToDashboard}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Main Dashboard" />
          </MenuItem>
          
          <MenuItem>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Account Settings" />
          </MenuItem>
          
          <MenuItem>
            <ListItemIcon>
              <HelpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Help & Support" />
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationMenuAnchor}
          open={Boolean(notificationMenuAnchor)}
          onClose={handleNotificationMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              minWidth: 320,
              maxHeight: 400,
              mt: 1,
              borderRadius: 2,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Notifications
            </Typography>
          </Box>
          
          <Divider />
          
          <MenuItem>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                New user registration
              </Typography>
              <Typography variant="caption" color="text.secondary">
                John Doe registered 5 minutes ago
              </Typography>
            </Box>
          </MenuItem>
          
          <MenuItem>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                System backup completed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Daily backup finished successfully
              </Typography>
            </Box>
          </MenuItem>
          
          <MenuItem>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Security alert
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Multiple failed login attempts detected
              </Typography>
            </Box>
          </MenuItem>
          
          <Divider />
          
          <MenuItem sx={{ justifyContent: 'center' }}>
            <Button size="small" variant="text">
              View All Notifications
            </Button>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;

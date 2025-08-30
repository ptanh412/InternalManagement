import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Collapse,
  Chip,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Report as ReportIcon,
  Storage as StorageIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Folder as FolderIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  ExpandLess,
  ExpandMore,
  Circle as CircleIcon,
} from '@mui/icons-material';

const AdminSidebar = ({ 
  open, 
  activeTab, 
  onTabChange, 
  onClose,
  userInfo,
  width = 280 
}) => {
  const theme = useTheme();
  const [expandedItems, setExpandedItems] = React.useState({});

  const handleExpand = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const navigationItems = [
    {
      id: 0,
      title: 'Dashboard',
      icon: DashboardIcon,
      color: theme.palette.primary.main,
    },
    {
      id: 1,
      title: 'User Management',
      icon: PeopleIcon,
      color: theme.palette.success.main,
      badge: '1,250',
      children: [
        { id: 'users-all', title: 'All Users', icon: CircleIcon },
        { id: 'users-active', title: 'Active Users', icon: CircleIcon },
        { id: 'users-blocked', title: 'Blocked Users', icon: CircleIcon },
        { id: 'users-roles', title: 'User Roles', icon: CircleIcon },
      ]
    },
    {
      id: 2,
      title: 'Group Management',
      icon: GroupIcon,
      color: theme.palette.info.main,
      badge: '156',
      children: [
        { id: 'groups-all', title: 'All Groups', icon: CircleIcon },
        { id: 'groups-active', title: 'Active Groups', icon: CircleIcon },
        { id: 'groups-reported', title: 'Reported Groups', icon: CircleIcon },
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: AnalyticsIcon,
      color: theme.palette.warning.main,
      children: [
        { id: 'reports-usage', title: 'Usage Reports', icon: CircleIcon },
        { id: 'reports-performance', title: 'Performance', icon: CircleIcon },
        { id: 'reports-security', title: 'Security Logs', icon: CircleIcon },
        { id: 'reports-export', title: 'Export Data', icon: CircleIcon },
      ]
    },
    {
      id: 'content',
      title: 'Content Management',
      icon: FolderIcon,
      color: theme.palette.secondary.main,
      children: [
        { id: 'content-messages', title: 'Messages', icon: CircleIcon },
        { id: 'content-files', title: 'File Storage', icon: CircleIcon },
        { id: 'content-moderation', title: 'Content Moderation', icon: CircleIcon },
      ]
    },
    {
      id: 3,
      title: 'System Settings',
      icon: SettingsIcon,
      color: theme.palette.error.main,
      children: [
        { id: 'settings-general', title: 'General Settings', icon: CircleIcon },
        { id: 'settings-security', title: 'Security Settings', icon: CircleIcon },
        { id: 'settings-notifications', title: 'Notifications', icon: CircleIcon },
        { id: 'settings-backup', title: 'Backup & Recovery', icon: CircleIcon },
      ]
    },
  ];

  const supportItems = [
    {
      id: 'help',
      title: 'Help & Documentation',
      icon: HelpIcon,
      color: theme.palette.grey[600],
    },
    {
      id: 'about',
      title: 'About System',
      icon: InfoIcon,
      color: theme.palette.grey[600],
    },
  ];

  const handleItemClick = (item) => {
    if (item.children) {
      handleExpand(item.id);
    } else {
      onTabChange(null, item.id);
      if (onClose) onClose();
    }
  };

  const renderNavItem = (item, isChild = false) => (
    <React.Fragment key={item.id}>
      <ListItem
        button
        onClick={() => handleItemClick(item)}
        sx={{
          mb: 0.5,
          mx: 1,
          borderRadius: 2,
          backgroundColor: activeTab === item.id ? alpha(item.color || theme.palette.primary.main, 0.1) : 'transparent',
          border: activeTab === item.id ? `1px solid ${alpha(item.color || theme.palette.primary.main, 0.3)}` : '1px solid transparent',
          '&:hover': {
            backgroundColor: alpha(item.color || theme.palette.primary.main, 0.05),
          },
          pl: isChild ? 4 : 2,
          minHeight: isChild ? 40 : 48,
        }}
      >
        <ListItemIcon sx={{ 
          minWidth: 40,
          color: activeTab === item.id ? (item.color || theme.palette.primary.main) : theme.palette.text.secondary,
        }}>
          <item.icon sx={{ fontSize: isChild ? 16 : 20 }} />
        </ListItemIcon>
        <ListItemText 
          primary={item.title}
          primaryTypographyProps={{
            fontSize: isChild ? '0.85rem' : '0.9rem',
            fontWeight: activeTab === item.id ? 600 : 500,
            color: activeTab === item.id ? (item.color || theme.palette.primary.main) : theme.palette.text.primary,
          }}
        />
        {item.badge && (
          <Chip
            label={item.badge}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              backgroundColor: alpha(item.color || theme.palette.primary.main, 0.1),
              color: item.color || theme.palette.primary.main,
              border: `1px solid ${alpha(item.color || theme.palette.primary.main, 0.2)}`,
            }}
          />
        )}
        {item.children && (
          expandedItems[item.id] ? <ExpandLess /> : <ExpandMore />
        )}
      </ListItem>
      
      {item.children && (
        <Collapse in={expandedItems[item.id]} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => renderNavItem(child, true))}
          </List>
        </Collapse>
      )}
    </React.Fragment>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Profile Section */}
      <Box sx={{ 
        p: 2, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Avatar
            src={userInfo?.avatar}
            sx={{
              width: 40,
              height: 40,
              mr: 1.5,
              bgcolor: theme.palette.secondary.main,
              border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
            }}
          >
            {userInfo?.firstName?.[0]}{userInfo?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {userInfo?.firstName} {userInfo?.lastName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              System Administrator
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<AdminIcon sx={{ fontSize: 14 }} />}
          label="ADMIN ACCESS"
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.warning.main, 0.9),
            color: theme.palette.warning.contrastText,
            fontSize: '0.7rem',
            height: 24,
          }}
        />
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: theme.palette.text.secondary,
            fontWeight: 600,
            fontSize: '0.7rem',
            letterSpacing: 1,
          }}
        >
          MANAGEMENT
        </Typography>
        
        <List dense>
          {navigationItems.map((item) => renderNavItem(item))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: theme.palette.text.secondary,
            fontWeight: 600,
            fontSize: '0.7rem',
            letterSpacing: 1,
          }}
        >
          SUPPORT
        </Typography>
        
        <List dense>
          {supportItems.map((item) => renderNavItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.grey[500], 0.05),
      }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Internal Management System
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          v2.1.0 • © 2024 Devteria
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          background: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: `8px 0 32px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default AdminSidebar;

import * as React from "react";
import { useState } from "react";
import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
  Box,
  Typography,
  Tooltip,
  Badge,
  Collapse,
  useTheme,
} from "@mui/material";
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Groups as GroupsIcon,
  Chat as ChatIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Settings as SettingsIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Dashboard as DashboardIcon,
  Assignment as ProjectManagerIcon,
} from "@mui/icons-material";
import { Link, useLocation as useRouterLocation } from "react-router-dom";

function SideMenu({ collapsed, onToggleCollapse }) {
  const location = useRouterLocation();
  const theme = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { 
      key: "home", 
      label: "Home", 
      icon: <HomeIcon />, 
      path: "/", 
      badge: null 
    },
    { 
      key: "chat", 
      label: "Chat", 
      icon: <ChatIcon />, 
      path: "/chat", 
      badge: 3 
    },
    { 
      key: "friends", 
      label: "Friends", 
      icon: <PeopleIcon />, 
      path: "/friends", 
      badge: null 
    },
    { 
      key: "groups", 
      label: "Groups", 
      icon: <GroupsIcon />, 
      path: "/groups", 
      badge: null 
    },
    { 
      key: "trending", 
      label: "Trending", 
      icon: <TrendingUpIcon />, 
      path: "/trending", 
      badge: null 
    },
    { 
      key: "bookmarks", 
      label: "Bookmarks", 
      icon: <BookmarkIcon />, 
      path: "/bookmarks", 
      badge: null 
    },
  ];

  const bottomMenuItems = [
    { 
      key: "notifications", 
      label: "Notifications", 
      icon: <NotificationsIcon />, 
      path: "/notifications", 
      badge: 5 
    },
    { 
      key: "settings", 
      label: "Settings", 
      icon: <SettingsIcon />, 
      path: "/settings", 
      badge: null 
    },
  ];

  const renderMenuItem = (item, isBottom = false) => {
    const isActive = location.pathname === item.path;
    
    const menuButton = (
      <ListItemButton
        component={item.path ? Link : "div"}
        to={item.path}
        selected={isActive}
        onMouseEnter={() => setHoveredItem(item.key)}
        onMouseLeave={() => setHoveredItem(null)}
        sx={{
          minHeight: 48,
          justifyContent: collapsed ? 'center' : 'initial',
          px: collapsed ? 1.5 : 2,
          borderRadius: 2,
          mx: 1,
          mb: 0.5,
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          overflow: 'hidden',
          '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main + '15',
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.main + '25',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: '60%',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '0 2px 2px 0',
            }
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            transform: 'translateX(4px)',
          }
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 2,
            justifyContent: 'center',
            color: isActive ? theme.palette.primary.main : 'inherit',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {item.badge && !collapsed ? (
            <Badge badgeContent={item.badge} color="error" variant="dot">
              {item.icon}
            </Badge>
          ) : item.badge && collapsed ? (
            <Badge badgeContent={item.badge} color="error" variant="standard">
              {item.icon}
            </Badge>
          ) : (
            item.icon
          )}
        </ListItemIcon>
        
        <Collapse in={!collapsed} timeout={200} orientation="horizontal">
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem',
              color: isActive ? theme.palette.primary.main : 'inherit',
            }}
          />
        </Collapse>
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip
          key={item.key}
          title={item.label}
          placement="right"
          arrow
          enterDelay={500}
        >
          <ListItem disablePadding>
            {menuButton}
          </ListItem>
        </Tooltip>
      );
    }

    return (
      <ListItem key={item.key} disablePadding>
        {menuButton}
      </ListItem>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Toolbar 
        sx={{ 
          display: 'flex', 
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2,
          minHeight: '64px !important',
        }}
      >
        <Collapse in={!collapsed} timeout={200} orientation="horizontal">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon color="primary" />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Bookteria
            </Typography>
          </Box>
        </Collapse>
        
        <IconButton
          onClick={onToggleCollapse}
          sx={{
            ml: collapsed ? 0 : 'auto',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              transform: 'scale(1.1)',
            }
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>

      <Divider sx={{ mx: 1 }} />

      {/* Main Menu Items */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      <Divider sx={{ mx: 1 }} />

      {/* Bottom Menu Items */}
      <Box sx={{ pb: 2 }}>
        <List disablePadding>
          {bottomMenuItems.map((item) => renderMenuItem(item, true))}
        </List>
      </Box>
    </Box>
  );
}

export default SideMenu;

import * as React from "react";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import { getMyInfo } from "../services/userService";

const drawerWidthExpanded = 280;
const drawerWidthCollapsed = 72;

function Scene({ children, darkMode, onToggleDarkMode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [sideMenuCollapsed, setSideMenuCollapsed] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const drawerWidth = sideMenuCollapsed ? drawerWidthCollapsed : drawerWidthExpanded;
  
  // Check if current page is Chat to handle different layouts
  const isChatPage = location.pathname === '/chat';

  // Load user info
  React.useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await getMyInfo();
        setUserInfo(response.data?.result);
        console.log("User Info:", response.data?.result);
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };

    loadUserInfo();
  }, []);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleSideMenuToggle = () => {
    setSideMenuCollapsed(!sideMenuCollapsed);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          ml: { sm: `${drawerWidth}px` },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Header 
            userInfo={userInfo}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
        }}
      >
        {/* Side Navigation */}
        <Box
          component="nav"
          sx={{ 
            width: { sm: drawerWidth }, 
            flexShrink: { sm: 500 },
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
          aria-label="navigation menu"
        >
          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidthExpanded,
                borderRight: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <SideMenu collapsed={false} onToggleCollapse={() => {}} />
          </Drawer>
          
          {/* Desktop Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
                borderRight: `1px solid ${theme.palette.divider}`,
                overflowX: 'hidden',
              },
            }}
            open
          >
            <SideMenu 
              collapsed={sideMenuCollapsed} 
              onToggleCollapse={handleSideMenuToggle} 
            />
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Toolbar />
          <Box
            sx={{
              display: "flex",
              justifyContent: isChatPage ? "stretch" : "center",
              width: "100%",
              minHeight: "calc(100vh - 64px)",
              p: isChatPage ? 0 : 2,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* Floating Action Button for Theme Toggle */}
      <Zoom in={true}>
        <Fab
          color="primary"
          aria-label="toggle theme"
          onClick={onToggleDarkMode}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: theme.zIndex.speedDial,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </Fab>
      </Zoom>
    </Box>
  );
}

export default Scene;

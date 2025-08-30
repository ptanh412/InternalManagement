import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Badge from "@mui/material/Badge";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreIcon from "@mui/icons-material/MoreVert";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { logOut } from "../services/authenticationService";
import NotificationMenu from './NotificationMenu';

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.15)
    : alpha(theme.palette.grey[500], 0.15),
  "&:hover": {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.25)
      : alpha(theme.palette.grey[500], 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  transition: theme.transitions.create(['background-color', 'border-color']),
  "&:focus-within": {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.primary.main, 0.05),
  },
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(3),
    width: "auto",
    minWidth: "300px",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    color: theme.palette.text.primary,
    "&::placeholder": {
      color: theme.palette.text.secondary,
      opacity: 1,
    },
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

export default function Header({
  userInfo = null,
  darkMode = false,
  onToggleDarkMode = () => { },
  showAdminBadge = false
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleOpenProfile = () => {
    setAnchorEl(null);
    window.location.href = "/profile";
  };

  const handleOpenAdmin = () => {
    setAnchorEl(null);
    window.location.href = "/admin";
  };

  const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.isAdmin;

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleLogout = (event) => {
    handleMenuClose();
    logOut();
    window.location.href = "/login";
  };

  const menuId = "primary-search-account-menu";
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleOpenProfile}>Profile</MenuItem>
      {isAdmin && (
        <MenuItem onClick={handleOpenAdmin}>
          <AdminPanelSettingsIcon sx={{ mr: 1 }} />
          Admin Panel
        </MenuItem>
      )}
      <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
      <MenuItem onClick={handleLogout}>Log Out</MenuItem>
    </Menu>
  );

  const mobileMenuId = "primary-search-account-menu-mobile";
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <IconButton size="large" aria-label="show 2 new mails" sx={{ color: 'text.primary' }}>
          <Badge badgeContent={2} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem>
        <IconButton
          size="large"
          aria-label="show 4 new notifications"
          sx={{ color: 'text.primary' }}
        >
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          sx={{ color: 'text.primary' }}
        >
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <IconButton
        size="large"
        edge="start"
        aria-label="open drawer"
        sx={{ mr: 2, color: 'text.primary' }}
        onClick={() => (window.location.href = "/")}
      >
        <Box
          component={"img"}
          style={{
            width: "35px",
            height: "35px",
            borderRadius: 6,
          }}
          src="/logo/devteria-logo.png"
        ></Box>
      </IconButton>
      <Search>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Search…"
          inputProps={{ "aria-label": "search" }}
        />
      </Search>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: 'center', gap: 1 }}>
        {/* Admin Badge */}
        {showAdminBadge && isAdmin && (
          <Tooltip title="Admin User">
            <Chip
              icon={<AdminPanelSettingsIcon />}
              label="Admin"
              color="secondary"
              size="small"
              sx={{ mr: 1 }}
            />
          </Tooltip>
        )}

        {/* Dark Mode Toggle */}
        <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <IconButton
            size="large"
            onClick={onToggleDarkMode}
            sx={{ color: 'text.primary' }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <IconButton
          size="large"
          aria-label="show 4 new mails"
          sx={{ color: 'text.primary' }}
        >
          <Badge badgeContent={4} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <NotificationMenu userId={userInfo?.userId} />
        <IconButton
          size="large"
          edge="end"
          aria-label="account of current user"
          aria-controls={menuId}
          aria-haspopup="true"
          onClick={handleProfileMenuOpen}
          sx={{ color: 'text.primary' }}
        >
          <AccountCircle />
        </IconButton>
      </Box>
      <Box sx={{ display: { xs: "flex", md: "none" } }}>
        <IconButton
          size="large"
          aria-label="show more"
          aria-controls={mobileMenuId}
          aria-haspopup="true"
          onClick={handleMobileMenuOpen}
          sx={{ color: 'text.primary' }}
        >
          <MoreIcon />
        </IconButton>
      </Box>
      {renderMobileMenu}
      {renderMenu}
    </>
  );
}

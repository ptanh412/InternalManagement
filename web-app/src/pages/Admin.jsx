import React, { useState, useEffect } from "react";
import CreateDepartmentConversationDialog from "../components/CreateDepartmentConversationDialog";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Switch,
  FormControlLabel,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
  Container,
  LinearProgress,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  Message as MessageIcon,
  Report as ReportIcon,
  Analytics as AnalyticsIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  Build as BuildIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Backup as BackupIcon,
  Speed as SpeedIcon,
  Group as GroupIcon,
  Container as ContainerIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import DepartmentManagement from "../components/DepartmentManagement";
import RoleManagement from "../components/RoleManagement";
import CreateUserDialog from "../components/CreateUserDialog";
import { getMyInfo } from "../services/userService";
import { getToken } from "../services/localStorageService";
import adminUserService from '../services/adminUserService';
import departmentService from '../services/departmentService';
import roleService from '../services/roleService';

const Admin = ({ darkMode, onToggleDarkMode }) => {
  // Apply style to body to hide vertical scrollbar when Admin page is mounted
  useEffect(() => {
    const originalOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';
    return () => {
      document.body.style.overflowY = originalOverflowY;
    };
  }, []);
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [openCreateDeptDialog, setOpenCreateDeptDialog] = useState(false);


  // Dashboard states
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    totalMessages: 0,
    onlineUsers: 0,
  });

  // User management states
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessRole: '',
    departmentId: ''
  });

  // Group management states
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [businessRoleOptions, setBusinessRoleOptions] = useState([]);

  // System settings states
  const [systemSettings, setSystemSettings] = useState({
    maxGroupSize: 100,
    maxFileSize: 10, // MB
    allowFileUploads: true,
    enableGroupCreation: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    checkAdminAccess();
    if (activeTab === 0) loadDashboardData();
    if (activeTab === 1) loadUsers();
    if (activeTab === 2) loadGroups();
    if (activeTab === 5) loadSystemSettings();
    // Tabs 3 and 4 are handled by their respective components
  }, [activeTab]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          departmentService.getAllDepartments(),
          roleService.getBusinessRoles(),
        ]);
        setDepartments(deptRes?.result || []);
        const rolesRaw = roleRes?.result || [];
        const options = Array.isArray(rolesRaw)
          ? rolesRaw.map((item) => {
            if (typeof item === 'string') {
              return { value: item, label: item };
            }
            // object case: expect {name, displayName}
            return { value: item.name || item.code || '', label: item.displayName || item.name || '' };
          }).filter(o => o.value && o.label)
          : [];
        setBusinessRoleOptions(options);
      } catch (e) {
        console.error('Failed to load departments/roles', e);
      }
    };
    loadMeta();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await getMyInfo();
      const userData = response.data?.result;

      setUserInfo(userData);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setError('Failed to verify admin access');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Mock dashboard data - replace with actual API calls
      setDashboardStats({
        totalUsers: 1250,
        activeUsers: 890,
        totalGroups: 156,
        totalMessages: 45678,
        onlineUsers: 234,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUserService.getAllUsers();
      // Assuming response.result is the array of users
      setUsers(response.result || []);
      console.log("Users loaded:", response.result);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      // Mock group data - replace with actual API call
      setGroups([
        {
          id: 1,
          name: 'General Discussion',
          memberCount: 45,
          createdBy: 'John Doe',
          createdAt: '2024-08-10T14:30:00Z',
          status: 'ACTIVE',
        },
        {
          id: 2,
          name: 'Development Team',
          memberCount: 12,
          createdBy: 'Jane Smith',
          createdAt: '2024-08-12T09:00:00Z',
          status: 'ACTIVE',
        },
      ]);
    } catch (error) {
      console.error('Error loading groups:', error);
      showNotification('Failed to load groups', 'error');
    }
  };

  const loadSystemSettings = async () => {
    try {
      // Mock system settings - replace with actual API call
      console.log('Loading system settings...');
    } catch (error) {
      console.error('Error loading system settings:', error);
      showNotification('Failed to load system settings', 'error');
    }
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUserMenuClick = (event, user) => {
    setSelectedUser(user);
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleEditUser = async (updatedUserData) => {
    try {
      setLoading(true);
      await adminUserService.updateUser(selectedUser.id, updatedUserData);
      showNotification(`User ${selectedUser.username} updated successfully`, 'success');
      loadUsers();
    } catch (error) {
      showNotification('Failed to update user', 'error');
    } finally {
      setEditUserDialog(false);
      setLoading(false);
    }
  };

  const openEditUserDialog = () => {
    if (!selectedUser) return;
    const normalizedBusinessRole = typeof selectedUser.businessRole === 'object'
      ? (selectedUser.businessRole?.name || selectedUser.businessRole?.code || '')
      : (selectedUser.businessRole || '');
    const normalizedDepartmentId = selectedUser.departmentId || selectedUser.department?.id || '';
    setEditForm({
      firstName: selectedUser.firstName || '',
      lastName: selectedUser.lastName || '',
      email: selectedUser.email || '',
      businessRole: normalizedBusinessRole,
      departmentId: normalizedDepartmentId
    });
    setEditUserDialog(true);
    setUserMenuAnchor(null);
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      await adminUserService.deleteUser(selectedUser.id);
      showNotification(`User ${selectedUser.username} deleted successfully`, 'success');
      loadUsers();
    } catch (error) {
      showNotification('Failed to delete user', 'error');
    } finally {
      handleUserMenuClose();
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      // Add block user API call here
      showNotification(`User ${selectedUser.username} blocked successfully`, 'success');
      loadUsers(); // Reload users
    } catch (error) {
      showNotification('Failed to block user', 'error');
    }
    handleUserMenuClose();
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  console.log("Filtered Users:", filteredUsers);

  const renderDashboard = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardStats.totalUsers}
                </Typography>
                <Typography variant="body2">Total Users</Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardStats.activeUsers}
                </Typography>
                <Typography variant="body2">Active Users</Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardStats.totalGroups}
                </Typography>
                <Typography variant="body2">Total Groups</Typography>
              </Box>
              <GroupAddIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardStats.totalMessages}
                </Typography>
                <Typography variant="body2">Total Messages</Typography>
              </Box>
              <MessageIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardStats.onlineUsers}
                </Typography>
                <Typography variant="body2">Online Now</Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonAddIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="New user registered"
                  secondary="john_doe joined 2 hours ago"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <GroupAddIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="New group created"
                  secondary="Development Team created by Jane Smith"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ReportIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="User reported"
                  secondary="Inappropriate behavior reported"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* System Health */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography>Database: Healthy</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography>Chat Service: Running</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography>File Service: Running</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography>Memory Usage: 75%</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderUserManagement = () => (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage user accounts, roles, and permissions across the organization.
        </Typography>
      </Box>

      {/* Action Bar */}
      <Card sx={{
        mb: 3,
        borderRadius: 3,
        boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
      }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 300 }}
              />
              <Chip
                label={`${filteredUsers.length} users found`}
                color="primary"
                variant="outlined"
              />
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setCreateUserDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Add User
              </Button>
              <IconButton
                onClick={loadUsers}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{
        borderRadius: 3,
        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  }
                }}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        src={user.avatar}
                        sx={{
                          mr: 2,
                          width: 40,
                          height: 40,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        }}
                      >
                        {user.username === 'admin' ? 'AD' : (
                          <>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </>
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {user.username === 'admin' ? 'Administrator' : (
                            <>
                              {user.firstName} {user.lastName}
                            </>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.businessRoleDisplayName}
                      color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.online ? 'Online' : 'Offline'}
                      color={user.online ? 'success' : 'default'}
                      size="small"
                      sx={{ borderRadius: 2, fontWeight: 600, minWidth: 70 }}
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <>
                        <Typography variant="body2">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(user.lastLogin).toLocaleTimeString()}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Never</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleUserMenuClick(e, user)}
                      size="small"
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
            minWidth: 180,
          }
        }}
      >
        <MenuItem onClick={openEditUserDialog}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleBlockUser}>
          <BlockIcon sx={{ mr: 1, fontSize: 18 }} />
          Block User
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete User
        </MenuItem>
      </Menu>
    </Container>
  );

  const renderGroupManagement = () => (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Group Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage conversation groups, channels, and community settings.
        </Typography>
      </Box>

      {/* Action Bar */}
      <Card sx={{
        mb: 3,
        borderRadius: 3,
        boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
      }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Search groups..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 300 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select defaultValue="all" displayEmpty>
                  <MenuItem value="all">All Groups</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
              <Chip
                label={`${groups.length} groups found`}
                color="primary"
                variant="outlined"
              />
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<GroupAddIcon />}
                sx={{ borderRadius: 2 }}
              >
                Create Group
              </Button>
              <IconButton
                onClick={loadGroups}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card sx={{
        borderRadius: 3,
        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Members</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id} sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  }
                }}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        src={group.avatar}
                        sx={{
                          mr: 2,
                          width: 40,
                          height: 40,
                          bgcolor: theme.palette.primary.main,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        }}
                      >
                        {group.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {group.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {group.description || 'No description'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PeopleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {group.memberCount || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {group.createdBy || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(group.createdAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={group.status || 'ACTIVE'}
                      color={group.status === 'ACTIVE' ? 'success' : 'error'}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {groups.length === 0 && (
        <Card sx={{
          mt: 4,
          borderRadius: 3,
          textAlign: 'center',
          py: 6,
          boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
        }}>
          <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No groups found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first group to get started with community management.
          </Typography>
          <Button
            variant="contained"
            startIcon={<GroupAddIcon />}
            sx={{ borderRadius: 2 }}
          >
            Create First Group
          </Button>
        </Card>
      )}
    </Container>
  );

  const renderSystemSettings = () => (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure application settings, security, and system preferences.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Chat Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <ChatIcon sx={{
                  mr: 2,
                  p: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 2,
                  color: 'primary.main',
                }} />
                <Typography variant="h6" fontWeight={600}>
                  Chat Settings
                </Typography>
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Max Group Size"
                  type="number"
                  value={systemSettings.maxGroupSize}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    maxGroupSize: parseInt(e.target.value)
                  })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Max File Size (MB)"
                  type="number"
                  value={systemSettings.maxFileSize}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    maxFileSize: parseInt(e.target.value)
                  })}
                  sx={{ mb: 2 }}
                />
              </Box>

              <List disablePadding>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary="Allow File Uploads"
                    secondary="Enable file sharing in conversations"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Switch
                    checked={systemSettings.allowFileUploads}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      allowFileUploads: e.target.checked
                    })}
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary="Enable Group Creation"
                    secondary="Allow users to create new groups"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Switch
                    checked={systemSettings.enableGroupCreation}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      enableGroupCreation: e.target.checked
                    })}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Maintenance */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <BuildIcon sx={{
                  mr: 2,
                  p: 1,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  borderRadius: 2,
                  color: 'warning.main',
                }} />
                <Typography variant="h6" fontWeight={600}>
                  System Maintenance
                </Typography>
              </Box>

              <List disablePadding sx={{ mb: 3 }}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary="Maintenance Mode"
                    secondary="Put the system in maintenance mode"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      maintenanceMode: e.target.checked
                    })}
                  />
                </ListItem>
              </List>

              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ClearIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Clear Cache
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Export Logs
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<BackupIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Database Backup
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <SecurityIcon sx={{
                  mr: 2,
                  p: 1,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  borderRadius: 2,
                  color: 'error.main',
                }} />
                <Typography variant="h6" fontWeight={600}>
                  Security Settings
                </Typography>
              </Box>

              <List disablePadding>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Require 2FA for admin accounts"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Switch defaultChecked />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary="Password Policy"
                    secondary="Enforce strong password requirements"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Switch defaultChecked />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary="Session Security"
                    secondary="Auto logout after 30 minutes"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Switch defaultChecked />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <SpeedIcon sx={{
                  mr: 2,
                  p: 1,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: 2,
                  color: 'success.main',
                }} />
                <Typography variant="h6" fontWeight={600}>
                  Performance Metrics
                </Typography>
              </Box>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight={500}>
                    Server Uptime
                  </Typography>
                  <Chip
                    label="99.9%"
                    color="success"
                    size="small"
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={99.9}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight={500}>
                    CPU Usage
                  </Typography>
                  <Typography variant="caption">25%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={25}
                  color="primary"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight={500}>
                    Memory Usage
                  </Typography>
                  <Typography variant="caption">3.2GB / 8GB</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={40}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box mt={4} display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Reset to Default
        </Button>
        <Button
          variant="contained"
          size="large"
          sx={{ borderRadius: 2 }}
        >
          Save Settings
        </Button>
      </Box>
    </Container>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: alpha(theme.palette.background.default, 0.97),
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {/* Button to open Create Department Conversation Dialog */}
      <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2000 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDeptDialog(true)}
        >
          New Department Conversation
        </Button>
      </Box>
      <CreateDepartmentConversationDialog
        open={openCreateDeptDialog}
        onClose={() => setOpenCreateDeptDialog(false)}
        onCreated={() => {
          setOpenCreateDeptDialog(false);
          // Optionally refresh conversation list or show notification
        }}
      />
      {/* Enhanced Admin Header */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          height: 64,
        }}>
          <Box display="flex" alignItems="center">
            <AdminIcon sx={{
              mr: 2,
              fontSize: 32,
              color: 'primary.main',
            }} />
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary">
                Admin Portal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Internal Management System
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              sx={{
                position: 'relative',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <NotificationsIcon />
              <Box sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                bgcolor: 'error.main',
                borderRadius: '50%',
              }} />
            </IconButton>

            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                src={userInfo?.avatar}
                sx={{
                  width: 32,
                  height: 32,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {userInfo?.firstName?.[0]}{userInfo?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {userInfo?.firstName} {userInfo?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrator
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Layout */}
      <Box sx={{
        display: 'flex',
        flex: 1,
        pt: 8,
      }}>
        {/* Enhanced Admin Sidebar */}
        <Box sx={{
          width: 280,
          bgcolor: 'background.paper',
          borderRight: `1px solid ${theme.palette.divider}`,
          position: 'fixed',
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          boxShadow: `2px 0 12px ${alpha(theme.palette.common.black, 0.05)}`,
        }}>
          <Box sx={{ p: 2 }}>
            <List disablePadding>
              <ListItem
                button
                selected={activeTab === 0}
                onClick={() => setActiveTab(0)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: activeTab === 0 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemIcon>
                  <DashboardIcon color={activeTab === 0 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary="Dashboard"
                  primaryTypographyProps={{
                    fontWeight: activeTab === 0 ? 600 : 400,
                    color: activeTab === 0 ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItem>

              <ListItem
                button
                selected={activeTab === 1}
                onClick={() => setActiveTab(1)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: activeTab === 1 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemIcon>
                  <PeopleIcon color={activeTab === 1 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary="User Management"
                  primaryTypographyProps={{
                    fontWeight: activeTab === 1 ? 600 : 400,
                    color: activeTab === 1 ? 'primary.main' : 'text.primary',
                  }}
                />
                {/* <Chip 
                  label={users.length} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                /> */}
              </ListItem>

              <ListItem
                button
                selected={activeTab === 2}
                onClick={() => setActiveTab(2)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: activeTab === 2 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemIcon>
                  <ChatIcon color={activeTab === 2 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary="Group Management"
                  primaryTypographyProps={{
                    fontWeight: activeTab === 2 ? 600 : 400,
                    color: activeTab === 2 ? 'primary.main' : 'text.primary',
                  }}
                />
                {/* <Chip 
                  label={groups.length} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                /> */}
              </ListItem>

              <ListItem
                button
                selected={activeTab === 3}
                onClick={() => setActiveTab(3)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: activeTab === 3 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemIcon>
                  <BusinessIcon color={activeTab === 3 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary="Departments"
                  primaryTypographyProps={{
                    fontWeight: activeTab === 3 ? 600 : 400,
                    color: activeTab === 3 ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItem>

              <ListItem
                button
                selected={activeTab === 4}
                onClick={() => setActiveTab(4)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: activeTab === 4 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemIcon>
                  <SecurityIcon color={activeTab === 4 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary="Roles & Permissions"
                  primaryTypographyProps={{
                    fontWeight: activeTab === 4 ? 600 : 400,
                    color: activeTab === 4 ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItem>

              <ListItem
                button
                selected={activeTab === 5}
                onClick={() => setActiveTab(5)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: activeTab === 5 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemIcon>
                  <SettingsIcon color={activeTab === 5 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary="System Settings"
                  primaryTypographyProps={{
                    fontWeight: activeTab === 5 ? 600 : 400,
                    color: activeTab === 5 ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Quick Actions */}
            <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
              Quick Actions
            </Typography>
            <List disablePadding sx={{ mt: 1 }}>
              <ListItem
                button
                sx={{ borderRadius: 2, mb: 0.5 }}
                onClick={() => setCreateUserDialog(true)}
              >
                <ListItemIcon>
                  <PersonAddIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Add User"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
              <ListItem
                button
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon>
                  <GroupAddIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Create Group"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
              <ListItem
                button
                sx={{ borderRadius: 2, mb: 0.5 }}
                onClick={() => setActiveTab(3)}
              >
                <ListItemIcon>
                  <BusinessIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Add Department"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
              <ListItem
                button
                sx={{ borderRadius: 2, mb: 0.5 }}
                onClick={() => setActiveTab(4)}
              >
                <ListItemIcon>
                  <SecurityIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Manage Roles"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
            </List>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{
          flex: 1,
          ml: '280px',
          p: 3,
          bgcolor: 'transparent',
        }}>
          {activeTab === 0 && renderDashboard()}
          {activeTab === 1 && renderUserManagement()}
          {activeTab === 2 && renderGroupManagement()}
          {activeTab === 3 && <DepartmentManagement />}
          {activeTab === 4 && <RoleManagement />}
          {activeTab === 5 && renderSystemSettings()}
        </Box>
      </Box>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserDialog}
        onClose={() => setCreateUserDialog(false)}
        onUserCreated={() => {
          setCreateUserDialog(false);
          loadUsers(); // Refresh users list
          setNotification({
            open: true,
            message: 'User created successfully!',
            severity: 'success'
          });
        }}
      />

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onClose={() => setEditUserDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" gap={2} mt={1}>
            <TextField
              label="First Name"
              fullWidth
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Last Name"
              fullWidth
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
          <TextField
            label="Email"
            fullWidth
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="edit-business-role-label">Business Role</InputLabel>
            <Select
              labelId="edit-business-role-label"
              label="Business Role"
              value={editForm.businessRole}
              onChange={(e) => setEditForm({ ...editForm, businessRole: e.target.value })}
            >
              {businessRoleOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel id="edit-department-label">Department</InputLabel>
            <Select
              labelId="edit-department-label"
              label="Department"
              value={editForm.departmentId}
              onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleEditUser(editForm)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Admin;

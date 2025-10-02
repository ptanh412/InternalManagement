import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd as AddUserIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonOff as DeactivateIcon,
  Person as ActivateIcon,
  Group as GroupIcon,
  Business as DepartmentIcon,
  Security as RoleIcon,
  Settings as ManageIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  FiberManualRecord as OnlineIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import adminUserService from '../../services/adminUserService';
import { roleService } from '../../services/roleService';
import { departmentService } from '../../services/departmentService';
import aiService from '../../services/aiService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminIdentityManager = ({ showNotification }) => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    departmentId: '',
    positionId: '',
    roles: []
  });

  // Role Management State
  const [roles, setRoles] = useState([]);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Department Management State
  const [departments, setDepartments] = useState([]);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  });

  // Reference Data
  const [positions, setPositions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [seniorityLevels, setSeniorityLevels] = useState([]);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadRoles(),
        loadDepartments(),
        loadReferenceData(),
        loadUserStats()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminUserService.getAllUsers();
      setUsers(response.result || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      throw error;
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleService.getAllRoles();
      setRoles(response.result || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
      throw error;
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.result || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      throw error;
    }
  };

  const loadReferenceData = async () => {
    try {
      const [positionsRes, permissionsRes, seniorityRes] = await Promise.all([
        adminUserService.getAllPositions(),
        adminUserService.getAllPermissions(),
        adminUserService.getAllSeniorityLevels()
      ]);
      
      setPositions(positionsRes.result || []);
      setPermissions(permissionsRes.result || []);
      setSeniorityLevels(seniorityRes.result || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      throw error;
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await adminUserService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
      throw error;
    }
  };

  // User Management Functions
  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      departmentId: '',
      positionId: '',
      roles: []
    });
    setUserDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      departmentId: user.departmentId || '',
      positionId: user.positionId || '',
      roles: user.roles || []
    });
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        // Update existing user
        await adminUserService.updateUser(selectedUser.id, userFormData);
        showNotification('User updated successfully', 'success');
      } else {
        // Create new user
        await adminUserService.createUser(userFormData);
        showNotification('User created successfully', 'success');
      }
      
      setUserDialogOpen(false);
      await loadUsers();
      await loadUserStats();
    } catch (error) {
      console.error('Failed to save user:', error);
      showNotification('Failed to save user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminUserService.deleteUser(userId);
        showNotification('User deleted successfully', 'success');
        await loadUsers();
        await loadUserStats();
      } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification('Failed to delete user', 'error');
      }
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      if (isActive) {
        await adminUserService.deactivateUser(userId);
        showNotification('User deactivated', 'info');
      } else {
        await adminUserService.activateUser(userId);
        showNotification('User activated', 'success');
      }
      await loadUsers();
      await loadUserStats();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      showNotification('Failed to update user status', 'error');
    }
  };

  // Role Management Functions
  const handleCreateRole = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: []
    });
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      await roleService.createRole(roleFormData);
      showNotification('Role created successfully', 'success');
      setRoleDialogOpen(false);
      await loadRoles();
    } catch (error) {
      console.error('Failed to save role:', error);
      showNotification('Failed to save role', 'error');
    }
  };

  const handleDeleteRole = async (roleName) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await roleService.deleteRole(roleName);
        showNotification('Role deleted successfully', 'success');
        await loadRoles();
      } catch (error) {
        console.error('Failed to delete role:', error);
        showNotification('Failed to delete role', 'error');
      }
    }
  };

  // Department Management Functions
  const handleCreateDepartment = () => {
    setDepartmentFormData({
      name: '',
      description: '',
      managerId: ''
    });
    setDepartmentDialogOpen(true);
  };

  const handleSaveDepartment = async () => {
    try {
      await departmentService.createDepartment(departmentFormData);
      showNotification('Department created successfully', 'success');
      setDepartmentDialogOpen(false);
      await loadDepartments();
    } catch (error) {
      console.error('Failed to save department:', error);
      showNotification('Failed to save department', 'error');
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.deleteDepartment(departmentId);
        showNotification('Department deleted successfully', 'success');
        await loadDepartments();
      } catch (error) {
        console.error('Failed to delete department:', error);
        showNotification('Failed to delete department', 'error');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Identity Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <GroupIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{userStats.total || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ActiveIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{userStats.active || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <OnlineIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{userStats.online || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online Now
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DepartmentIcon color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{departments.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Departments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Users" />
          <Tab label="Roles" />
          <Tab label="Departments" />
        </Tabs>
      </Box>

      {/* Users Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddUserIcon />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {departments.find(d => d.id === user.departmentId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.active ? <ActiveIcon /> : <InactiveIcon />}
                      label={user.active ? 'Active' : 'Inactive'}
                      color={user.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.roles?.map(role => (
                        <Chip key={role} label={role} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit User">
                        <IconButton size="small" onClick={() => handleEditUser(user)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.active ? "Deactivate" : "Activate"}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleUserStatus(user.id, user.active)}
                          color={user.active ? "warning" : "success"}
                        >
                          {user.active ? <DeactivateIcon /> : <ActivateIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Roles Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Role Management</Typography>
          <Button
            variant="contained"
            startIcon={<RoleIcon />}
            onClick={handleCreateRole}
          >
            Add Role
          </Button>
        </Box>

        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.name}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6">{role.name}</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {role.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {role.permissions?.map(permission => (
                          <Chip key={permission} label={permission} size="small" />
                        ))}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteRole(role.name)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Departments Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Department Management</Typography>
          <Button
            variant="contained"
            startIcon={<DepartmentIcon />}
            onClick={handleCreateDepartment}
          >
            Add Department
          </Button>
        </Box>

        <Grid container spacing={2}>
          {departments.map((department) => (
            <Grid item xs={12} md={6} lg={4} key={department.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6">{department.name}</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {department.description}
                      </Typography>
                      <Typography variant="caption">
                        Manager: {department.managerName || 'Not assigned'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteDepartment(department.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={userFormData.firstName}
                onChange={(e) => setUserFormData(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={userFormData.lastName}
                onChange={(e) => setUserFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={userFormData.username}
                onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            {!selectedUser && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={userFormData.departmentId}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={userFormData.positionId}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, positionId: e.target.value }))}
                >
                  {positions.map(pos => (
                    <MenuItem key={pos.id} value={pos.id}>{pos.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={roles.map(role => role.name)}
                value={userFormData.roles}
                onChange={(e, newValue) => setUserFormData(prev => ({ ...prev, roles: newValue }))}
                renderInput={(params) => (
                  <TextField {...params} label="Roles" placeholder="Select roles" />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={roleFormData.description}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={permissions}
                value={roleFormData.permissions}
                onChange={(e, newValue) => setRoleFormData(prev => ({ ...prev, permissions: newValue }))}
                renderInput={(params) => (
                  <TextField {...params} label="Permissions" placeholder="Select permissions" />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained">
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={departmentDialogOpen} onClose={() => setDepartmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Department</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department Name"
                value={departmentFormData.name}
                onChange={(e) => setDepartmentFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={departmentFormData.description}
                onChange={(e) => setDepartmentFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Manager</InputLabel>
                <Select
                  value={departmentFormData.managerId}
                  onChange={(e) => setDepartmentFormData(prev => ({ ...prev, managerId: e.target.value }))}
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDepartment} variant="contained">
            Create Department
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminIdentityManager;
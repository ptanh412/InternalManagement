import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  Alert,
  Container,
  LinearProgress,
  FormControl,
  Select,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import roleService from '../services/roleService';

const RoleManagement = () => {
  const theme = useTheme();
  const [roles, setRoles] = useState([]);
  const [businessRoles, setBusinessRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleUsers, setRoleUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);

  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [viewUsersDialog, setViewUsersDialog] = useState(false);
  const [hierarchyDialog, setHierarchyDialog] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });
  const [allPermissions, setAllPermissions] = useState([]);
  // Fetch all permissions for edit dialog
  const loadAllPermissions = async () => {
    try {
      const response = await roleService.getAllPermissions();
      console.log("All permissions loaded:", response.result);
      setAllPermissions(response.result || []);
    } catch (error) {
      setAllPermissions([]);
    }
  };

  // Open edit dialog and load permissions
  const handleEditRole = async (role) => {
    setSelectedRole(role);
    // Ensure permissions is always an array of permission names (strings)
    let perms = Array.isArray(role.permissions)
      ? role.permissions.map(p => typeof p === 'string' ? p : p.name)
      : [];
    setFormData({
      name: role.name,
      description: role.description,
      permissions: perms,
    });
    await loadAllPermissions();
    setEditDialog(true);
  };

  // Update role permissions
  const handleUpdateRole = async () => {
    setLoading(true);
    try {
      // Only send the new permissions array as required by the backend
      await roleService.updateRole(
        formData.name,
        formData.permissions
      );
      setEditDialog(false);
      setSelectedRole(null);
      loadRoles();
      setSuccessAlert(true);
      setTimeout(() => setSuccessAlert(false), 3000);
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };
  const [formErrors, setFormErrors] = useState({});

  // Menu states
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Available permissions list
  const availablePermissions = [
    'USER_READ', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
    'DEPARTMENT_READ', 'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE',
    'PROJECT_READ', 'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_DELETE',
    'DOCUMENT_READ', 'DOCUMENT_CREATE', 'DOCUMENT_UPDATE', 'DOCUMENT_DELETE',
    'REPORTS_VIEW', 'REPORTS_CREATE', 'SYSTEM_CONFIG', 'ADMIN_ACCESS'
  ];

  useEffect(() => {
    loadRoles();
    loadBusinessRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await roleService.getAllRoles();
      setRoles(response.result || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessRoles = async () => {
    try {
      const response = await roleService.getBusinessRoles();
      setBusinessRoles(response.result || []);
    } catch (error) {
      console.error('Error loading business roles:', error);
    }
  };

  const loadRoleUsers = async (businessRole) => {
    try {
      const response = await roleService.getUsersByBusinessRole(businessRole);
      setRoleUsers(response.result || []);
    } catch (error) {
      console.error('Error loading role users:', error);
      setRoleUsers([]);
    }
  };

  const loadOrganizationalHierarchy = async () => {
    try {
      const response = await roleService.getOrganizationalHierarchy();
      setRoleUsers(response.result || []);
    } catch (error) {
      console.error('Error loading organizational hierarchy:', error);
      setRoleUsers([]);
    }
  };

  const handleCreateRole = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await roleService.createRole(formData);
      setCreateDialog(false);
      resetForm();
      loadRoles();
    } catch (error) {
      console.error('Error creating role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    setLoading(true);
    try {
      await roleService.deleteRole(selectedRole.name);
      setDeleteDialog(false);
      setSelectedRole(null);
      loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = 'Role name is required';
    }
    if (!formData.description?.trim()) {
      errors.description = 'Role description is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setFormErrors({});
    setSelectedRole(null);
  };

  const handleMenuOpen = (event, role) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleEdit = async () => {
    await handleEditRole(selectedRole);
    handleMenuClose();
  };

  const handleViewUsers = async (businessRole) => {
    await loadRoleUsers(businessRole);
    setViewUsersDialog(true);
    handleMenuClose();
  };

  const handleViewHierarchy = async () => {
    await loadOrganizationalHierarchy();
    setHierarchyDialog(true);
    handleMenuClose();
  };

  const handlePermissionChange = (permission) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];

    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (roleName) => {
    if (roleName?.includes('ADMIN')) return 'error';
    if (roleName?.includes('MANAGER') || roleName?.includes('DIRECTOR')) return 'warning';
    if (roleName?.includes('USER')) return 'primary';
    return 'default';
  };

  const getBusinessRoleIcon = (role) => {
    switch (role) {
      case 'DIRECTOR': return <AdminIcon sx={{ color: 'error.main' }} />;
      case 'HEADER_DEPARTMENT': return <SupervisorIcon sx={{ color: 'warning.main' }} />;
      case 'DEPUTY_DEPARTMENT': return <AssignmentIcon sx={{ color: 'info.main' }} />;
      case 'MANAGER': return <BusinessIcon sx={{ color: 'success.main' }} />;
      default: return <PeopleIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Role & Permission Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage system roles, business roles, and organizational hierarchy.
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
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 300 }}
              />
              <Chip
                label={`${filteredRoles.length} roles found`}
                color="primary"
                variant="outlined"
              />
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<SupervisorIcon />}
                onClick={handleViewHierarchy}
                sx={{ borderRadius: 2 }}
              >
                View Hierarchy
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Add Role
              </Button>
              <IconButton
                onClick={loadRoles}
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

      {/* Role Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="primary">
                {roles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Roles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <BusinessIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="success.main">
                {businessRoles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Business Roles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {availablePermissions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Permissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <AdminIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="error.main">
                {roles.filter(role => role.name?.includes('ADMIN')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin Roles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* System Roles */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                System Roles
              </Typography>
              {loading && <LinearProgress sx={{ mb: 2 }} />}

              <TableContainer sx={{ overflowX: 'hidden' }}>
                {/* i want to hidden scroll X here */}
                <Table size="small" sx={{ minWidth: 300, overflowX: 'hidden' }} >
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.name} sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        }
                      }}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              sx={{
                                mr: 2,
                                width: 32,
                                height: 32,
                                bgcolor: theme.palette[getRoleColor(role.name)]?.main || theme.palette.primary.main,
                              }}
                            >
                              <SecurityIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {role.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {role.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${role.permissions?.length || 0} permissions`}
                            size="small"
                            color={getRoleColor(role.name)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, role)}
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

              {/* Empty State */}
              {filteredRoles.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                  <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No roles found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Business Roles */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Business Hierarchy
              </Typography>

              <List disablePadding>
                {businessRoles.map((role, index) => (
                  <ListItem
                    key={role.name}
                    button
                    onClick={() => handleViewUsers(role.name)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" mr={2}>
                      {getBusinessRoleIcon(role.name)}
                    </Box>
                    <ListItemText
                      primary={role.name?.replace(/_/g, ' ') || role.name}
                      secondary={role.description || `Level ${index + 1} - Business Role`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <Chip
                      label="View Users"
                      size="small"
                      variant="outlined"
                      sx={{ ml: 'auto' }}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Organizational Chart Button */}
              <Box mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SupervisorIcon />}
                  onClick={handleViewHierarchy}
                  sx={{ borderRadius: 2 }}
                >
                  View Complete Hierarchy
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
            minWidth: 180,
          }
        }}
      >
        {/* Role Actions */}
        <MenuItem onClick={handleEdit} sx={{ color: 'blue.main' }}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit Role
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete Role
        </MenuItem>
      </Menu>
      {/* Edit Role Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <EditIcon sx={{ mr: 1 }} />
            Edit Role
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Role Name"
                fullWidth
                variant="outlined"
                value={formData.name}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Description"
                fullWidth
                variant="outlined"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              <Grid container spacing={1}>
                {allPermissions.map((permission) => {
                  // permission can be string or object, handle both
                  const permValue = typeof permission === 'string' ? permission : permission.name;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={permValue}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.permissions.includes(permValue)}
                            onChange={() => handlePermissionChange(permValue)}
                          />
                        }
                        label={permValue.replace(/_/g, ' ')}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={loading}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AddIcon sx={{ mr: 1 }} />
            Create New Role
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                autoFocus
                label="Role Name"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Description"
                fullWidth
                variant="outlined"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              <Grid container spacing={1}>
                {availablePermissions.map((permission) => (
                  <Grid item xs={12} sm={6} md={4} key={permission}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.permissions.includes(permission)}
                          onChange={() => handlePermissionChange(permission)}
                        />
                      }
                      label={permission.name}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRole}
            variant="contained"
            disabled={loading}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" color="error.main">
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Role
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. Users with this role will lose their permissions.
          </Alert>
          <Typography>
            Are you sure you want to delete the role <strong>"{selectedRole?.name}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteRole}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Users Dialog */}
      <Dialog open={viewUsersDialog} onClose={() => setViewUsersDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PeopleIcon sx={{ mr: 1 }} />
            Users with Business Role
          </Box>
        </DialogTitle>
        <DialogContent>
          {roleUsers.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Department</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roleUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar src={user.avatar} sx={{ mr: 2, width: 32, height: 32 }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {user.firstName} {user.lastName}
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
                          label={user.department?.name || 'No Department'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No users found with this role
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewUsersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Organizational Hierarchy Dialog */}
      <Dialog open={hierarchyDialog} onClose={() => setHierarchyDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SupervisorIcon sx={{ mr: 1 }} />
            Organizational Hierarchy
          </Box>
        </DialogTitle>
        <DialogContent>
          {roleUsers.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Business Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roleUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar src={user.avatar} sx={{ mr: 2, width: 32, height: 32 }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getBusinessRoleIcon(user.businessRole)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {user.businessRole?.replace(/_/g, ' ') || 'Employee'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.department?.name || 'No Department'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`Level ${businessRoles.findIndex(role => role.name === user.businessRole) + 1 || 'N/A'}`}
                          size="small"
                          color="secondary"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <SupervisorIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No hierarchy data available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHierarchyDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Success Alert */}
      {successAlert && (
        <Alert severity="success" sx={{ mb: 2, position: 'fixed', bottom: 10, left: 32, zIndex: 9999 }}>
          Role updated successfully!
        </Alert>
      )}
    </Container>
  );
};

export default RoleManagement;

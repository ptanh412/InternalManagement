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
  alpha,
  useTheme,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AccountTree as HierarchyIcon,
} from '@mui/icons-material';
import departmentService from '../services/departmentService';

const DepartmentManagement = () => {
  const theme = useTheme();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  
  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [viewUsersDialog, setViewUsersDialog] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.result || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentUsers = async (departmentId) => {
    try {
      const response = await departmentService.getUsersByDepartment(departmentId);
      setDepartmentUsers(response.result || []);
    } catch (error) {
      console.error('Error loading department users:', error);
      setDepartmentUsers([]);
    }
  };

  const handleCreateDepartment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await departmentService.createDepartment(formData);
      setCreateDialog(false);
      resetForm();
      loadDepartments();
    } catch (error) {
      console.error('Error creating department:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await departmentService.updateDepartment(selectedDepartment.id, formData);
      setEditDialog(false);
      resetForm();
      loadDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    setLoading(true);
    try {
      await departmentService.deleteDepartment(selectedDepartment.id);
      setDeleteDialog(false);
      setSelectedDepartment(null);
      loadDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = 'Department name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Department name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      errors.name = 'Department name must not exceed 100 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setFormErrors({});
    setSelectedDepartment(null);
  };

  const handleMenuOpen = (event, department) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDepartment(department);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    setFormData({ name: selectedDepartment.name });
    setEditDialog(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleViewUsers = async () => {
    await loadDepartmentUsers(selectedDepartment.id);
    setViewUsersDialog(true);
    handleMenuClose();
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Department Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage organizational departments and their hierarchical structure.
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
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ minWidth: 300 }}
              />
              <Chip 
                label={`${filteredDepartments.length} departments found`} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Add Department
              </Button>
              <IconButton 
                onClick={loadDepartments}
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

      {/* Department Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="primary">
                {departments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="success.main">
                {departments.reduce((sum, dept) => sum + (dept.userCount || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <HierarchyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {Math.round(departments.reduce((sum, dept) => sum + (dept.userCount || 0), 0) / Math.max(departments.length, 1))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Team Size
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <CardContent>
              <BusinessIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="info.main">
                {departments.filter(dept => (dept.userCount || 0) > 0).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Departments Table */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
      }}>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Employee Count</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDepartments.map((department) => (
                <TableRow key={department.id} sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  }
                }}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar 
                        sx={{ 
                          mr: 2,
                          width: 40,
                          height: 40,
                          bgcolor: theme.palette.primary.main,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        }}
                      >
                        {department.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {department.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {department.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PeopleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {department.userCount || 0} employees
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={department.userCount > 0 ? 'Active' : 'Empty'}
                      color={department.userCount > 0 ? 'success' : 'default'}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, department)}
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
        {filteredDepartments.length === 0 && !loading && (
          <Box textAlign="center" py={6}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No departments found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first department to get started'}
            </Typography>
            {!searchQuery && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Add Department
              </Button>
            )}
          </Box>
        )}
      </Card>

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
        <MenuItem onClick={handleViewUsers}>
          <PeopleIcon sx={{ mr: 1, fontSize: 18 }} />
          View Employees
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit Department
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete Department
        </MenuItem>
      </Menu>

      {/* Create Department Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AddIcon sx={{ mr: 1 }} />
            Create New Department
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Department Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateDepartment}
            variant="contained"
            disabled={loading}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <EditIcon sx={{ mr: 1 }} />
            Edit Department
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Department Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateDepartment}
            variant="contained"
            disabled={loading}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" color="error.main">
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Department
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All employees in this department will need to be reassigned.
          </Alert>
          <Typography>
            Are you sure you want to delete the department <strong>"{selectedDepartment?.name}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteDepartment}
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
            Department Employees - {selectedDepartment?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {departmentUsers.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Business Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentUsers.map((user) => (
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
                          label={user.businessRole || 'Employee'}
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
                No employees in this department
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewUsersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DepartmentManagement;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  LocationCity as LocationIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { createUser } from '../services/userService';
import departmentService from '../services/departmentService';

const AdminUserDialog = ({ 
  open, 
  onClose, 
  user, 
  isEditing = false, 
  onSave 
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    dob: null,
    city: '',
    departmentId: '',
    businessRole: '',
    employeeId: '',
    phoneNumber: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [success, setSuccess] = useState(false);

  const businessRoles = [
    { value: 'DIRECTOR', label: 'Director', color: 'error' },
    { value: 'HEADER_DEPARTMENT', label: 'Department Head', color: 'warning' },
    { value: 'DEPUTY_DEPARTMENT', label: 'Deputy Department Head', color: 'info' },
    { value: 'MANAGER', label: 'Manager', color: 'success' },
    { value: 'EMPLOYEE', label: 'Employee', color: 'default' },
  ];

  useEffect(() => {
    if (open) {
      loadDepartments();
      if (user && isEditing) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          password: '',
          confirmPassword: '',
          dob: user.dob ? dayjs(user.dob) : null,
          city: user.city || '',
          departmentId: user.departmentId || '',
          businessRole: user.businessRole || '',
          employeeId: user.employeeId || '',
          phoneNumber: user.phoneNumber || '',
        });
      } else {
        resetForm();
      }
      setErrors({});
      setSuccess(false);
    }
  }, [user, isEditing, open]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.result || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      dob: null,
      city: '',
      departmentId: '',
      businessRole: '',
      employeeId: '',
      phoneNumber: '',
    });
    setErrors({});
    setSuccess(false);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDateChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      dob: newValue
    }));
    
    if (errors.dob) {
      setErrors(prev => ({
        ...prev,
        dob: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation (only for new users)
    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Date of birth validation
    if (formData.dob) {
      const age = dayjs().diff(formData.dob, 'year');
      if (age < 10) {
        newErrors.dob = 'User must be at least 10 years old';
      }
    }

    // Phone number validation
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    // Employee ID validation
    if (formData.employeeId && formData.employeeId.length < 3) {
      newErrors.employeeId = 'Employee ID must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob ? formData.dob.format('YYYY-MM-DD') : null,
        city: formData.city || null,
        departmentId: formData.departmentId || null,
        businessRole: formData.businessRole || null,
        employeeId: formData.employeeId || null,
        phoneNumber: formData.phoneNumber || null,
      };

      if (!isEditing) {
        userData.password = formData.password;
      }

      if (isEditing) {
        // Handle update logic here
        console.log('Update user:', userData);
      } else {
        await createUser(userData);
        setSuccess(true);
        setTimeout(() => {
          onSave && onSave();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to save user' });
    } finally {
      setLoading(false);
    }
  };

  const getBusinessRoleColor = (role) => {
    const roleObj = businessRoles.find(r => r.value === role);
    return roleObj?.color || 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ 
              mr: 2, 
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
            }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {isEditing ? 'Edit User' : 'Create New User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isEditing ? 'Update user information and settings' : 'Fill in the details to create a new user account'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              User created successfully! Welcome email has been sent.
            </Alert>
          )}

          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Basic Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        variant="outlined"
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        error={!!errors.username}
                        helperText={errors.username}
                        disabled={isEditing}
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        variant="outlined"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        error={!!errors.email}
                        helperText={errors.email}
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        variant="outlined"
                        value={formData.firstName}
                        onChange={handleInputChange('firstName')}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        variant="outlined"
                        value={formData.lastName}
                        onChange={handleInputChange('lastName')}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Security Information */}
            {!isEditing && (
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.warning.main, 0.02),
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <SecurityIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6" fontWeight={600}>
                        Security Information
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Password"
                          type="password"
                          variant="outlined"
                          value={formData.password}
                          onChange={handleInputChange('password')}
                          error={!!errors.password}
                          helperText={errors.password || 'Minimum 6 characters'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm Password"
                          type="password"
                          variant="outlined"
                          value={formData.confirmPassword}
                          onChange={handleInputChange('confirmPassword')}
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Personal Information */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.info.main, 0.02),
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <LocationIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Personal Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Date of Birth"
                        value={formData.dob}
                        onChange={handleDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.dob,
                            helperText: errors.dob,
                          },
                        }}
                        maxDate={dayjs().subtract(10, 'year')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        variant="outlined"
                        value={formData.city}
                        onChange={handleInputChange('city')}
                        error={!!errors.city}
                        helperText={errors.city}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        variant="outlined"
                        value={formData.phoneNumber}
                        onChange={handleInputChange('phoneNumber')}
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber || 'Optional: +1234567890'}
                        InputProps={{
                          startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Business Information */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.success.main, 0.02),
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <BusinessIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Business Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Department</InputLabel>
                        <Select
                          value={formData.departmentId}
                          onChange={handleInputChange('departmentId')}
                          label="Department"
                        >
                          <MenuItem value="">
                            <em>No Department</em>
                          </MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Business Role</InputLabel>
                        <Select
                          value={formData.businessRole}
                          onChange={handleInputChange('businessRole')}
                          label="Business Role"
                        >
                          <MenuItem value="">
                            <em>No Business Role</em>
                          </MenuItem>
                          {businessRoles.map((role) => (
                            <MenuItem key={role.value} value={role.value}>
                              <Box display="flex" alignItems="center">
                                <Chip
                                  label={role.label}
                                  color={role.color}
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Employee ID"
                        variant="outlined"
                        value={formData.employeeId}
                        onChange={handleInputChange('employeeId')}
                        error={!!errors.employeeId}
                        helperText={errors.employeeId || 'Optional: Unique employee identifier'}
                        InputProps={{
                          startAdornment: <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Summary */}
            {(formData.firstName || formData.lastName || formData.businessRole || formData.departmentId) && (
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.primary.main}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      User Summary
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.firstName && formData.lastName && (
                        <Chip 
                          label={`${formData.firstName} ${formData.lastName}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {formData.businessRole && (
                        <Chip 
                          label={businessRoles.find(r => r.value === formData.businessRole)?.label || formData.businessRole}
                          color={getBusinessRoleColor(formData.businessRole)}
                          variant="outlined"
                        />
                      )}
                      {formData.departmentId && (
                        <Chip 
                          label={departments.find(d => d.id === formData.departmentId)?.name || 'Department'}
                          color="info"
                          variant="outlined"
                        />
                      )}
                      {formData.employeeId && (
                        <Chip 
                          label={`ID: ${formData.employeeId}`}
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || success}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              isEditing ? 'Update User' : 'Create User'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AdminUserDialog;


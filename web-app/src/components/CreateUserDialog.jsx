import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  FormHelperText,
  InputAdornment,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Business as BusinessIcon,
  ContactMail as ContactIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Phone as PhoneIcon,
  LocationCity as CityIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { createUser } from '../services/userService';
import departmentService from '../services/departmentService';
import roleService from '../services/roleService';

const CreateUserDialog = ({ open, onClose, onUserCreated }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [businessRoles, setBusinessRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const steps = ['Basic Information', 'Contact & Location', 'Business Details'];

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    dob: '',
    city: '',
    phoneNumber: '',
    departmentId: '',
    businessRole: '',
    employeeId: '',
  });

  useEffect(() => {
    if (open) {
      loadDepartments();
      loadBusinessRoles();
    }
  }, [open]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.result || []);
    } catch (error) {
      console.error('Error loading departments:', error);
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

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.username?.trim()) {
          newErrors.username = 'Username is required';
        } else if (formData.username.length < 4) {
          newErrors.username = 'Username must be at least 4 characters';
        }

        if (!formData.password?.trim()) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.email?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.firstName?.trim()) {
          newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName?.trim()) {
          newErrors.lastName = 'Last name is required';
        }

        if (!formData.dob) {
          newErrors.dob = 'Date of birth is required';
        } else {
          const age = Math.floor((new Date() - new Date(formData.dob)) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 16) {
            newErrors.dob = 'User must be at least 16 years old';
          }
        }
        break;

      case 1: // Contact & Location
        if (!formData.city?.trim()) {
          newErrors.city = 'City is required';
        }

        if (formData.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
          newErrors.phoneNumber = 'Please enter a valid phone number';
        }
        break;

      case 2: // Business Details
        if (!formData.departmentId) {
          newErrors.departmentId = 'Department is required';
        }

        if (!formData.employeeId?.trim()) {
          newErrors.employeeId = 'Employee ID is required';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    setSubmitError('');

    try {
      // Format data for backend

      console.log("Form data submitted:", formData);
      const userData = {
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob || null,
        city: formData.city.trim(),
        phoneNumber: formData.phoneNumber?.trim() || null,
        departmentId: formData.departmentId || null,
        businessRole: formData.businessRole || null,
        employeeId: formData.employeeId?.trim() || null,
      };

      const response = await createUser(userData);
      
      if (response.code === 1000) {
        onUserCreated && onUserCreated(response.result);
        handleClose();
      } else {
        setSubmitError(response.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        'An error occurred while creating the user'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      username: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
      dob: '',
      city: '',
      phoneNumber: '',
      departmentId: '',
      businessRole: '',
      employeeId: '',
    });
    setErrors({});
    setSubmitError('');
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Basic Information
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Enter the user's personal details and login credentials.
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonAddIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SecurityIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ContactIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                error={!!errors.dob}
                helperText={errors.dob}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  max: new Date().toISOString().split('T')[0], // Set max to today
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Contact & Location
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Provide contact information and location details.
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={!!errors.city}
                helperText={errors.city}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CityIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                placeholder="+1 234 567 8900"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Business Details
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Assign department, role, and employee identification.
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.departmentId}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.departmentId}
                  onChange={(e) => handleInputChange('departmentId', e.target.value)}
                  label="Department"
                  startAdornment={
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  }
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                          {dept.name?.[0]}
                        </Avatar>
                        {dept.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.departmentId && (
                  <FormHelperText>{errors.departmentId}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Business Role (Optional)</InputLabel>
                <Select
                  value={formData.businessRole}
                  onChange={(e) => handleInputChange('businessRole', e.target.value)}
                  label="Business Role (Optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {businessRoles.map((role) => (
                    <MenuItem key={role.name} value={role.name}>
                      <Chip
                        label={role.name?.replace(/_/g, ' ') || role.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                error={!!errors.employeeId}
                helperText={errors.employeeId}
                placeholder="EMP001, DEV123, etc."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* User Preview */}
            <Grid item xs={12}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    User Preview
                  </Typography>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {formData.firstName?.[0]}{formData.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {formData.firstName} {formData.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{formData.username} • {formData.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body2">
                        {departments.find(d => d.id === formData.departmentId)?.name || 'Not assigned'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Employee ID
                      </Typography>
                      <Typography variant="body2">
                        {formData.employeeId || 'Not assigned'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <PersonAddIcon sx={{ mr: 1 }} />
          Create New User
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 3 }}>
            {renderStepContent(activeStep)}
          </Box>

          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserDialog;

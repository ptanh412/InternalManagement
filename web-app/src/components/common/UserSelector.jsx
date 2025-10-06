import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Avatar,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { getUsersByRole } from '../../services/userService';

const UserSelector = ({
  label,
  value,
  onChange,
  roleName,
  placeholder = "Select a user...",
  required = false,
  disabled = false,
  helperText = "",
  error = false,
  multiple = false
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roleName) {
      fetchUsersByRole();
    }
  }, [roleName]);

  const fetchUsersByRole = async () => {
    setLoading(true);
    try {
      const userData = await getUsersByRole(roleName);
      setUsers(userData || []);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getOptionLabel = (option) => {
    if (!option) return '';
    return `${option.firstName} ${option.lastName} (${option.employeeId})`;
  };

  const renderOption = (props, option) => (
    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <Avatar
        src={option.avatar}
        alt={`${option.firstName} ${option.lastName}`}
        sx={{ width: 40, height: 40 }}
      >
        {`${option.firstName?.[0] || ''}${option.lastName?.[0] || ''}`}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {option.firstName} {option.lastName}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ID: {option.employeeId}
          </Typography>
          <Chip
            label={option.roleName}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 16 }}
          />
          {option.departmentName && (
            <Typography variant="caption" color="text.secondary">
              • {option.departmentName}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );

  const renderTags = (tagValue, getTagProps) =>
    tagValue.map((option, index) => (
      <Chip
        variant="outlined"
        label={getOptionLabel(option)}
        avatar={
          <Avatar
            src={option.avatar}
            sx={{ width: 24, height: 24 }}
          >
            {`${option.firstName?.[0] || ''}${option.lastName?.[0] || ''}`}
          </Avatar>
        }
        {...getTagProps({ index })}
        key={option.id}
      />
    ));

  const handleChange = (event, newValue) => {
    if (multiple) {
      onChange(newValue);
    } else {
      onChange(newValue);
    }
  };

  return (
    <Autocomplete
      multiple={multiple}
      options={users}
      value={value}
      onChange={handleChange}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      loading={loading}
      disabled={disabled}
      renderOption={renderOption}
      renderTags={multiple ? renderTags : undefined}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          helperText={helperText}
          error={error}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {!multiple && value && (
                  <Avatar
                    src={value.avatar}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  >
                    {`${value.firstName?.[0] || ''}${value.lastName?.[0] || ''}`}
                  </Avatar>
                )}
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default UserSelector;

import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Popover,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Button,
  Chip,
  Checkbox,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import { search as searchUsers } from "../services/userService";

const NewChatPopover = ({ anchorEl, open, onClose, onSelectUser, onCreateGroup }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0 = Direct Chat, 1 = Group Chat
  
  // Group chat specific states
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  // Memoized search function to avoid recreating on every render
  const handleSearch = useCallback(async (query) => {
    if (!query?.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const response = await searchUsers(query.trim());
      if (response?.data?.result) {
        setSearchResults(response.data.result);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    handleClearSearch();
    setSelectedUsers([]);
    setGroupName("");
  };

  // Group chat user selection handler
  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.userId === user.userId);
      if (isSelected) {
        return prev.filter(u => u.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  };

  // Create group handler
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError("Please select at least one user for the group");
      return;
    }

    setIsCreatingGroup(true);
    setError(null);

    try {
      const groupData = {
        groupName: groupName.trim(),
        participantIds: selectedUsers.map(user => user.userId),
        groupAvatar: null // Optional: could add avatar upload later
      };

      await onCreateGroup(groupData);
      
      // Reset form
      setGroupName("");
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      setError("Failed to create group. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setHasSearched(false);
        setError(null);
      }
    }, 500); // 500ms debounce time

    // Cleanup function to clear timeout if component unmounts or query changes
    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);
  // No need for handleKeyPress anymore as search is debounced
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleUserSelect = (user) => {
    onSelectUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            p: 2,
            mt: 1,
          },
        },
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
        Start a new conversation
      </Typography>
      
      {/* Tabs for Direct Chat vs Group Chat */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="fullWidth"
      >
        <Tab 
          icon={<PersonIcon />} 
          label="Direct Chat" 
          sx={{ minHeight: 48 }}
        />
        <Tab 
          icon={<GroupIcon />} 
          label="Group Chat" 
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {/* Group Name Input (only for group chat) */}
      {tabValue === 1 && (
        <TextField
          fullWidth
          placeholder="Enter group name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          sx={{ mb: 2 }}
          label="Group Name"
          variant="outlined"
        />
      )}

      {/* Selected Users Chips (only for group chat) */}
      {tabValue === 1 && selectedUsers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Selected users ({selectedUsers.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedUsers.map(user => (
              <Chip
                key={user.userId}
                avatar={<Avatar src={user.avatar} sx={{ width: 24, height: 24 }} />}
                label={user.firstName + ' ' + user.lastName}
                onDelete={() => handleUserToggle(user)}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* User Search */}
      <TextField
        fullWidth
        placeholder={tabValue === 0 ? "Start typing to search users..." : "Search users to add to group..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClearSearch}
                aria-label="clear search"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        autoFocus
      />{" "}
      <Box sx={{ height: 300, overflow: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && searchResults.length > 0 && (
          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                onClick={() => {
                  if (tabValue === 0) {
                    // Direct chat - select user immediately
                    handleUserSelect(user);
                  } else {
                    // Group chat - toggle user selection
                    handleUserToggle(user);
                  }
                }}
                sx={{
                  borderRadius: 1,
                  cursor: "pointer",
                  bgcolor: tabValue === 1 && selectedUsers.some(u => u.userId === user.userId) 
                    ? 'action.selected' 
                    : 'transparent',
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                {/* Checkbox for group chat mode */}
                {tabValue === 1 && (
                  <ListItemAvatar>
                    <Checkbox
                      checked={selectedUsers.some(u => u.userId === user.userId)}
                      onChange={() => handleUserToggle(user)}
                      size="small"
                    />
                  </ListItemAvatar>
                )}
                
                <ListItemAvatar>
                  <Avatar src={user.avatar || ""} alt={user.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  secondary={user.firstName + " " + user.lastName}
                  primaryTypographyProps={{
                    fontWeight: "medium",
                    variant: "body1",
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {!loading && !error && searchResults.length === 0 && hasSearched && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography color="text.secondary">
              No users found matching "{searchQuery}"
            </Typography>
          </Box>
        )}

        {!loading && !error && !hasSearched && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography color="text.secondary">
              {tabValue === 0 
                ? "Search for a user to start a conversation"
                : "Search for users to add to your group"
              }
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Create Group Button (only visible in group chat tab) */}
      {tabValue === 1 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreatingGroup}
            startIcon={isCreatingGroup ? <CircularProgress size={16} /> : <GroupIcon />}
          >
            {isCreatingGroup 
              ? "Creating Group..." 
              : `Create Group (${selectedUsers.length} user${selectedUsers.length === 1 ? '' : 's'})`
            }
          </Button>
        </Box>
      )}
    </Popover>
  );
};

NewChatPopover.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectUser: PropTypes.func.isRequired,
  onCreateGroup: PropTypes.func.isRequired,
};

export default NewChatPopover;

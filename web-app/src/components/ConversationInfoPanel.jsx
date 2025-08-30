import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Paper,
  Snackbar,
  Alert,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ListItemAvatar,
  CircularProgress,
} from "@mui/material";
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PowerPointIcon,
  Archive as ZipIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  MoreVert as MoreVertIcon,
  PersonRemove as PersonRemoveIcon,
  SwapHoriz as TransferIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";
import { downloadMediaFileWithFeedback } from "../services/fileDownloadService";
import { removeMembersFromGroup, addMembersToGroup } from "../services/chatService";
import { search as searchUsers } from "../services/userService";
import { uploadGroupAvatar } from "../services/socketMediaService";

// Helper function to get file icon based on file type
const getFileIcon = (fileType, fileName) => {
  const extension = fileName?.split('.').pop()?.toLowerCase();

  if (fileType?.startsWith('image/')) return <ImageIcon color="primary" />;
  if (fileType?.startsWith('video/')) return <VideoIcon color="secondary" />;
  if (fileType?.startsWith('audio/')) return <AudioIcon color="info" />;

  switch (extension) {
    case 'pdf':
      return <PdfIcon color="error" />;
    case 'doc':
    case 'docx':
      return <DocIcon color="primary" />;
    case 'xls':
    case 'xlsx':
      return <ExcelIcon color="success" />;
    case 'ppt':
    case 'pptx':
      return <PowerPointIcon color="warning" />;
    case 'zip':
    case 'rar':
    case '7z':
      return <ZipIcon color="action" />;
    default:
      return <FileIcon color="action" />;
  }
};

// Helper function to categorize files
const categorizeFiles = (attachments) => {
  const images = [];
  const documents = [];

  attachments?.forEach(file => {
    const extension = file.fileName?.split('.').pop()?.toLowerCase();
    const isImage = file.fileType?.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);

    if (isImage) {
      images.push(file);
    } else {
      documents.push(file);
    }
  });

  return { images, documents };
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Scrollable container with custom scrollbar styling
const ScrollableContainer = ({ children, maxHeight = '60vh', ...props }) => (
  <Box
    sx={{
      flex: 1,
      overflow: 'auto',
      p: 2,
      maxHeight: maxHeight,
      minHeight: 0, // Important for flex children to shrink
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(0,0,0,0.3)',
      },
      // Smooth scrolling
      scrollBehavior: 'smooth',
      ...props.sx
    }}
    {...props}
  >
    {children}
  </Box>
);

const ConversationInfoPanel = ({
  conversation,
  conversationAttachments = [],
  currentUserId,
  onClose,
  onRemoveMembers,
  onAddMembers,
  onLeaveGroup,
  onEditGroupInfo
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [downloadFeedback, setDownloadFeedback] = useState({ open: false, message: '', severity: 'info' });

  // Member management states
  const [memberActionsAnchorEl, setMemberActionsAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsersForAdd, setSelectedUsersForAdd] = useState([]);

  // Edit group info states
  const [editGroupInfoDialogOpen, setEditGroupInfoDialogOpen] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupAvatar, setEditingGroupAvatar] = useState('');
  const [isEditingGroupInfo, setIsEditingGroupInfo] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { images, documents } = categorizeFiles(conversationAttachments);

  // Debug logging to track conversation changes
  useEffect(() => {
    console.log("🔥 ConversationInfoPanel: conversation prop changed", {
      conversationId: conversation?.id,
      participantsCount: conversation?.participants?.length,
      participants: conversation?.participants?.map(p => ({ userId: p.userId, username: p.username }))
    });
  }, [conversation?.id, conversation?.participants?.length, conversation?.participants]);

  // Check if current conversation is a group
  const isGroupConversation = conversation?.type === 'GROUP' || conversation?.conversationType === 'GROUP';

  // Check if current user is the group creator/leader
  const isGroupLeader = conversation?.createdBy === currentUserId || conversation?.groupLeader === currentUserId;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileDownload = async (file) => {
    try {
      console.log('Downloading file:', file);

      if (!file.fileUrl || !file.fileName) {
        setDownloadFeedback({
          open: true,
          message: 'File information is incomplete',
          severity: 'error'
        });
        return;
      }

      setDownloadFeedback({
        open: true,
        message: `Downloading ${file.fileName}...`,
        severity: 'info'
      });

      const result = await downloadMediaFileWithFeedback(file.fileUrl, file.fileName);

      if (result.success) {
        setDownloadFeedback({
          open: true,
          message: `${file.fileName} downloaded successfully!`,
          severity: 'success'
        });
      } else {
        setDownloadFeedback({
          open: true,
          message: result.error || 'Download failed',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setDownloadFeedback({
        open: true,
        message: 'Download failed. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseFeedback = () => {
    setDownloadFeedback({ ...downloadFeedback, open: false });
  };

  // Member management functions
  const handleMemberActionsClick = (event, member) => {
    event.stopPropagation();
    setSelectedMember(member);
    setMemberActionsAnchorEl(event.currentTarget);
  };

  const handleMemberActionsClose = () => {
    setMemberActionsAnchorEl(null);
    setSelectedMember(null);
  };

  // Handle user selection for adding members
  const handleUserSelection = (user) => {
    if (selectedUsersForAdd.find(u => u.userId === user.userId)) {
      setSelectedUsersForAdd(selectedUsersForAdd.filter(u => u.userId !== user.userId));
    } else {
      setSelectedUsersForAdd([...selectedUsersForAdd, user]);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !onRemoveMembers) {
      console.error('No member selected or onRemoveMembers function not provided');
      handleMemberActionsClose();
      return;
    }

    // Check if user has permission to remove members
    if (!isGroupLeader) {
      setDownloadFeedback({
        open: true,
        message: 'Only group leader can remove members',
        severity: 'error'
      });
      handleMemberActionsClose();
      return;
    }

    // Don't allow removing yourself (use leave group instead)
    if (selectedMember.userId === currentUserId) {
      setDownloadFeedback({
        open: true,
        message: 'Use leave group to remove yourself from the group',
        severity: 'warning'
      });
      handleMemberActionsClose();
      return;
    }

    try {
      console.log('Removing member:', selectedMember);

      // Show loading message
      setDownloadFeedback({
        open: true,
        message: `Removing ${selectedMember?.username || selectedMember?.firstName + ' ' + selectedMember?.lastName}...`,
        severity: 'info'
      });

      // Call the WebSocket remove members function
      await onRemoveMembers(conversation.id, [selectedMember.userId]);

      // Show success message
      setDownloadFeedback({
        open: true,
        message: `${selectedMember?.username || selectedMember?.firstName + ' ' + selectedMember?.lastName} has been removed from the group`,
        severity: 'success'
      });

      console.log('Member removed successfully');

    } catch (error) {
      console.error('Error removing member:', error);
      setDownloadFeedback({
        open: true,
        message: error.message || 'Failed to remove member. Please try again.',
        severity: 'error'
      });
    } finally {
      handleMemberActionsClose();
    }
  };

  const handleTransferLeadership = async () => {
    try {
      // Implement transfer leadership API call
      console.log('Transferring leadership to:', selectedMember);
      setDownloadFeedback({
        open: true,
        message: `Leadership transferred to ${selectedMember?.username}`,
        severity: 'success'
      });
    } catch (error) {
      setDownloadFeedback({
        open: true,
        message: 'Failed to transfer leadership',
        severity: 'error'
      });
    }
    handleMemberActionsClose();
  };

  const handleMakeDeputy = async () => {
    try {
      // Implement make deputy API call
      console.log('Making deputy:', selectedMember);
      setDownloadFeedback({
        open: true,
        message: `${selectedMember?.username} is now a deputy`,
        severity: 'success'
      });
    } catch (error) {
      setDownloadFeedback({
        open: true,
        message: 'Failed to make deputy',
        severity: 'error'
      });
    }
    handleMemberActionsClose();
  };

  const handleAddMember = async () => {
    if (selectedUsersForAdd.length === 0) {
      setDownloadFeedback({
        open: true,
        message: 'Please select at least one user to add',
        severity: 'error'
      });
      return;
    }

    if (!onAddMembers) {
      setDownloadFeedback({
        open: true,
        message: 'Add members function not available',
        severity: 'error'
      });
      return;
    }

    try {
      // Show loading message
      setDownloadFeedback({
        open: true,
        message: `Adding ${selectedUsersForAdd.length} member(s) to the group...`,
        severity: 'info'
      });

      const participantIds = selectedUsersForAdd.map(user => user.userId);

      // Call the WebSocket add members function
      await onAddMembers(conversation.id, participantIds);

      // Show success message
      setDownloadFeedback({
        open: true,
        message: `Successfully added ${selectedUsersForAdd.length} member(s) to the group`,
        severity: 'success'
      });

      // Reset dialog state
      setAddMemberDialogOpen(false);
      setSelectedUsersForAdd([]);
      setSearchResults([]);
      setNewMemberEmail('');
    } catch (error) {
      console.error('Error adding members:', error);
      setDownloadFeedback({
        open: true,
        message: error.message || 'Failed to add members. Please try again.',
        severity: 'error'
      });
    }
  };

  // Get member role
  const getMemberRole = (member) => {
    if (member?.userId === conversation?.createdBy || member?.userId === conversation?.groupLeader) {
      return 'leader';
    }
    if (member?.isDeputy || member?.role === 'deputy') {
      return 'deputy';
    }
    return 'member';
  };

  // Get role display info
  const getRoleDisplayInfo = (role) => {
    switch (role) {
      case 'leader':
        return { label: 'Group Leader', color: 'primary', icon: <StarIcon sx={{ fontSize: 14 }} /> };
      case 'deputy':
        return { label: 'Deputy', color: 'secondary', icon: <ShieldIcon sx={{ fontSize: 14 }} /> };
      default:
        return { label: 'Member', color: 'default', icon: null };
    }
  };

  // Edit group info functions
  const handleEditGroupInfoClick = () => {
    setEditingGroupName(conversation?.conversationName || '');
    setEditingGroupAvatar(conversation?.conversationAvatar || '');
    setEditGroupInfoDialogOpen(true);
  };

  const handleEditGroupInfoCancel = () => {
    setEditGroupInfoDialogOpen(false);
    setEditingGroupName('');
    setEditingGroupAvatar('');
    setSelectedAvatarFile(null);
  };

  // Handle avatar file selection
  const handleAvatarFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(file.type)) {
      setDownloadFeedback({
        open: true,
        message: 'Invalid file type. Please select an image file (JPEG, PNG, GIF, or WebP).',
        severity: 'error'
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setDownloadFeedback({
        open: true,
        message: 'Avatar image size too large. Please select an image smaller than 5MB.',
        severity: 'error'
      });
      return;
    }

    setSelectedAvatarFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setEditingGroupAvatar(previewUrl);
  };

  const handleEditGroupInfoSave = async () => {
    if (!onEditGroupInfo) {
      setDownloadFeedback({
        open: true,
        message: 'Edit group info function not available',
        severity: 'error'
      });
      return;
    }

    if (!editingGroupName.trim()) {
      setDownloadFeedback({
        open: true,
        message: 'Group name cannot be empty',
        severity: 'error'
      });
      return;
    }

    setIsEditingGroupInfo(true);

    try {
      let finalAvatarUrl = editingGroupAvatar.trim();

      // If user selected a new avatar file, upload it first
      if (selectedAvatarFile) {
        setDownloadFeedback({
          open: true,
          message: 'Uploading avatar image...',
          severity: 'info'
        });

        setIsUploadingAvatar(true);
        
        try {
          const uploadResult = await uploadGroupAvatar(selectedAvatarFile);
          finalAvatarUrl = uploadResult.url;
          
          console.log("🖼️ Avatar uploaded, URL:", finalAvatarUrl);
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          setDownloadFeedback({
            open: true,
            message: uploadError.message || 'Failed to upload avatar image',
            severity: 'error'
          });
          return;
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      setDownloadFeedback({
        open: true,
        message: 'Updating group information...',
        severity: 'info'
      });

      await onEditGroupInfo(conversation.id, editingGroupName.trim(), finalAvatarUrl);

      setDownloadFeedback({
        open: true,
        message: 'Group information updated successfully',
        severity: 'success'
      });

      setEditGroupInfoDialogOpen(false);
      setEditingGroupName('');
      setEditingGroupAvatar('');
      setSelectedAvatarFile(null);
    } catch (error) {
      console.error('Failed to update group info:', error);
      setDownloadFeedback({
        open: true,
        message: error.message || 'Failed to update group information',
        severity: 'error'
      });
    } finally {
      setIsEditingGroupInfo(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 350,
        height: '100%',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Conversation Info
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Conversation Details */}
      <Box sx={{ p: 1.5, textAlign: 'center', position: 'relative' }}>
        {/* Edit button for group conversations */}
        {isGroupConversation && (
          <IconButton
            onClick={handleEditGroupInfoClick}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'background.paper',
                boxShadow: 2
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        <Avatar
          src={conversation?.conversationAvatar}
          sx={{
            width: 60,
            height: 60,
            mx: 'auto',
            mb: 1.5,
            border: '2px solid',
            borderColor: 'primary.light'
          }}
        />
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {conversation?.conversationName || 'Unknown Conversation'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {conversation?.participants?.length || 0} participants
        </Typography>
      </Box>

      <Divider />

      {/* File Attachments Section */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ minHeight: 48 }}
          >
            {isGroupConversation && (
              <Tab
                label={`Members (${conversation?.participants?.length || 0})`}
                icon={<PeopleIcon />}
                iconPosition="start"
                sx={{ minHeight: 48, fontSize: '0.75rem' }}
              />
            )}
            <Tab
              label={`Images (${images.length})`}
              icon={<ImageIcon />}
              iconPosition="start"
              sx={{ minHeight: 48, fontSize: '0.75rem' }}
            />
            <Tab
              label={`attachmens (${documents.length})`}
              icon={<DocIcon />}
              iconPosition="start"
              sx={{ minHeight: 48, fontSize: '0.75rem' }}
            />
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0 // Important for proper flex behavior
        }}>
          {/* Members Tab (for group conversations) */}
          {isGroupConversation && activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header with buttons - fixed at top, not scrollable */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                p: 2, 
                pb: 1,
                borderBottom: 1,
                borderColor: 'divider',
                overflow: 'visible', // Prevent clipping of tooltips
                zIndex: 10 // Ensure tooltips appear above other content
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Group Members
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {isGroupLeader && (
                    <Tooltip 
                      title="Add Member"
                      placement="top"
                      disableInteractive={true}
                      PopperProps={{
                        modifiers: [
                          {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                              altAxis: true,
                              altBoundary: true,
                              tether: true,
                              rootBoundary: 'viewport',
                            },
                          },
                        ],
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setAddMemberDialogOpen(true)}
                        sx={{ 
                          bgcolor: 'primary.light', 
                          '&:hover': { bgcolor: 'primary.main' },
                          flexShrink: 0, // Prevent button from shrinking
                          position: 'relative' // Ensure proper tooltip positioning
                        }}
                      >
                        <PersonAddIcon sx={{ fontSize: 18, color: 'white' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {/* Leave group icon */}
                  <Tooltip 
                    title="Leave Group" 
                    placement="top"
                    disableInteractive={true}
                    PopperProps={{
                      modifiers: [
                        {
                          name: 'preventOverflow',
                          enabled: true,
                          options: {
                            altAxis: true,
                            altBoundary: true,
                            tether: true,
                            rootBoundary: 'viewport',
                          },
                        },
                      ],
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => onLeaveGroup(conversation.id)}
                      sx={{ 
                        bgcolor: 'error.main', 
                        '&:hover': { bgcolor: 'error.dark' },
                        flexShrink: 0, // Prevent button from shrinking
                        position: 'relative' // Ensure proper tooltip positioning
                      }}
                    >
                      <PersonRemoveIcon sx={{ fontSize: 18, color: 'white' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Scrollable member list */}
              <ScrollableContainer maxHeight="calc(50vh - 80px)">
                <List dense>
                {conversation?.participants?.map((participant, index) => {
                  const role = getMemberRole(participant);
                  const roleInfo = getRoleDisplayInfo(role);

                  return (
                    <ListItem
                      key={index}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        px: 1,
                        py: 0.5
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={participant?.avatar}
                          sx={{ width: 32, height: 32 }}
                        >
                          {participant?.username?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {participant?.username || 'Unknown User'}
                            </Typography>
                            {roleInfo.icon}
                          </Box>
                        }
                        secondary={
                          <Chip
                            label={roleInfo.label}
                            color={roleInfo.color}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        }
                      />
                      {isGroupLeader && participant?.userId !== currentUserId && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMemberActionsClick(e, participant)}
                        >
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </ListItem>
                  );
                })}
              </List>
              </ScrollableContainer>
            </Box>
          )}

          {/* Images Tab */}
          {activeTab === (isGroupConversation ? 1 : 0) && (
            <ScrollableContainer maxHeight="50vh">
              {images.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No images shared
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {images.length} image{images.length !== 1 ? 's' : ''} found
                  </Typography>
                  <Grid container spacing={1} sx={{ pb: 2 }}>
                    {images.map((image, index) => (
                      <Grid item xs={6} key={index}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' }
                          }}
                          onClick={() => handleFileDownload(image)}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 80,
                                backgroundImage: image.fileUrl ? `url(${image.fileUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundColor: image.fileUrl ? 'transparent' : 'grey.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {!image.fileUrl && <ImageIcon sx={{ fontSize: 24, color: 'grey.400' }} />}
                            </Box>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  color: 'white',
                                  width: 24,
                                  height: 24,
                                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileDownload(image);
                                }}
                              >
                                <DownloadIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography
                              variant="caption"
                              noWrap
                              title={image.fileName}
                              sx={{ fontSize: '0.7rem' }}
                            >
                              {image.fileName || 'Untitled'}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                              sx={{ fontSize: '0.65rem' }}
                            >
                              {formatFileSize(image.fileSize)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </ScrollableContainer>
          )}

          {/* Documents Tab */}
          {activeTab === (isGroupConversation ? 2 : 1) && (
            <ScrollableContainer maxHeight="50vh">
              {documents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DocIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No attachmens shared
                  </Typography>
                </Box>
              ) : (
                <List dense sx={{ pb: 2 }}>
                  {documents.map((doc, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                        px: 1,
                        py: 0.5
                      }}
                      onClick={() => handleFileDownload(doc)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getFileIcon(doc.fileType, doc.fileName)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontSize: '0.8rem', fontWeight: 500 }}
                          >
                            {doc.fileName || 'Untitled Document'}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem' }}
                          >
                            {formatFileSize(doc.fileSize)}
                          </Typography>
                        }
                        sx={{ my: 0 }}
                      />
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileDownload(doc);
                          }}
                          sx={{ ml: 1 }}
                        >
                          <DownloadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
              )}
            </ScrollableContainer>
          )}
        </Box>
      </Box>

      {/* Download Feedback Snackbar */}
      <Snackbar
        open={downloadFeedback.open}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={downloadFeedback.severity}
          variant="filled"
        >
          {downloadFeedback.message}
        </Alert>
      </Snackbar>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={memberActionsAnchorEl}
        open={Boolean(memberActionsAnchorEl)}
        onClose={handleMemberActionsClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        {/* Only show Remove Member for group leaders and not for current user */}
        {isGroupLeader && selectedMember?.userId !== currentUserId && (
          <MenuItem onClick={handleRemoveMember}>
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography color="error">Remove Member</Typography>
          </MenuItem>
        )}
        {isGroupLeader && selectedMember?.userId !== currentUserId && (
          <MenuItem onClick={handleTransferLeadership}>
            <ListItemIcon>
              <TransferIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <Typography>Transfer Leadership</Typography>
          </MenuItem>
        )}
        {isGroupLeader && selectedMember?.userId !== currentUserId && (
          <MenuItem onClick={handleMakeDeputy}>
            <ListItemIcon>
              <SecurityIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <Typography>Make Deputy</Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Add Member Dialog */}
      <Dialog
        open={addMemberDialogOpen}
        onClose={() => {
          setAddMemberDialogOpen(false);
          setSelectedUsersForAdd([]);
          setSearchResults([]);
          setNewMemberEmail('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Add Members to {conversation?.conversationName}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search users"
            type="text"
            fullWidth
            variant="outlined"
            onChange={async (e) => {
              const keyword = e.target.value;
              setNewMemberEmail(keyword);
              if (keyword.length > 2) {
                setIsSearching(true);
                try {
                  const response = await searchUsers(keyword);
                  const users = response?.data?.result || [];

                  // Filter out users who are already participants
                  const existingParticipantIds = conversation?.participants?.map(p => p.userId) || [];
                  const availableUsers = users.filter(user => !existingParticipantIds.includes(user.userId));

                  setSearchResults(availableUsers);
                } catch (error) {
                  console.error("Error searching users:", error);
                  setSearchResults([]);
                } finally {
                  setIsSearching(false);
                }
              } else {
                setSearchResults([]);
              }
            }}
            sx={{ mb: 2 }}
          />

          {isSearching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {searchResults.length > 0 && (
            <List>
              {searchResults.map((user) => (
                <ListItem
                  key={user.userId}
                  button
                  onClick={() => handleUserSelection(user)}
                  sx={{
                    backgroundColor: selectedUsersForAdd.find(u => u.userId === user.userId)
                      ? 'primary.light'
                      : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.avatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${user.firstName} ${user.lastName}`}
                    secondary={`@${user.username}`}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {selectedUsersForAdd.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected users ({selectedUsersForAdd.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsersForAdd.map((user) => (
                  <Chip
                    key={user.userId}
                    label={`${user.firstName} ${user.lastName}`}
                    onDelete={() => {
                      setSelectedUsersForAdd(selectedUsersForAdd.filter(u => u.userId !== user.userId));
                    }}
                    avatar={<Avatar src={user.avatar} />}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setAddMemberDialogOpen(false);
              setSelectedUsersForAdd([]);
              setSearchResults([]);
              setNewMemberEmail('');
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            variant="contained"
            disabled={selectedUsersForAdd.length === 0}
          >
            Add Members ({selectedUsersForAdd.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Info Dialog */}
      <Dialog
        open={editGroupInfoDialogOpen}
        onClose={handleEditGroupInfoCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Group Information</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Group Name"
              variant="outlined"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              margin="normal"
              required
            />
            
            {/* Avatar Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Group Avatar
              </Typography>
              
              {/* Upload from device option */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload-button"
                  type="file"
                  onChange={handleAvatarFileSelect}
                />
                <label htmlFor="avatar-upload-button">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={isUploadingAvatar ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                    disabled={isEditingGroupInfo || isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </label>
                {selectedAvatarFile && (
                  <Typography variant="caption" color="text.secondary">
                    Selected: {selectedAvatarFile.name}
                  </Typography>
                )}
              </Box>

              {/* URL input option */}
              <TextField
                fullWidth
                label="Or enter Avatar URL"
                variant="outlined"
                value={selectedAvatarFile ? '' : editingGroupAvatar}
                onChange={(e) => {
                  if (!selectedAvatarFile) {
                    setEditingGroupAvatar(e.target.value);
                  }
                }}
                disabled={selectedAvatarFile !== null}
                helperText={selectedAvatarFile ? 'Clear uploaded file to use URL' : 'Enter a URL for the group avatar image'}
              />
              
              {/* Clear uploaded file button */}
              {selectedAvatarFile && (
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedAvatarFile(null);
                    setEditingGroupAvatar(conversation?.conversationAvatar || '');
                  }}
                  sx={{ mt: 1 }}
                >
                  Use URL Instead
                </Button>
              )}
            </Box>

            {/* Avatar Preview */}
            {editingGroupAvatar && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Avatar Preview:
                </Typography>
                <Avatar
                  src={editingGroupAvatar}
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    border: '2px solid',
                    borderColor: 'primary.light'
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleEditGroupInfoCancel}
            color="inherit"
            disabled={isEditingGroupInfo}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditGroupInfoSave}
            variant="contained"
            disabled={isEditingGroupInfo || !editingGroupName.trim()}
            startIcon={isEditingGroupInfo ? <CircularProgress size={16} /> : <EditIcon />}
          >
            {isEditingGroupInfo ? 'Updating...' : 'Update Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ConversationInfoPanel;

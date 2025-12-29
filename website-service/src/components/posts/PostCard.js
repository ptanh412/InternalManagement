import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Collapse,
  ImageList,
  ImageListItem,
  Chip,
  Stack,
  Divider,
  Paper,
  Fade,
  Zoom,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
  Public as PublicIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ReactionButton } from './ReactionButton';
import { CommentList } from './Comment';
import EditPostModal from './EditPostModal';
import postApiService from '../../services/postApiService';
import { formatDistanceToNow } from 'date-fns';
import { apiService } from '../../services/apiService';
import socketIOService from '../../services/socketIOService';

const PostCard = ({ post, currentUserId, onPostUpdate, onPostDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userName, setUserName] = useState(post.username || '');
  const [commentCount, setCommentCount] = useState(post.commentCount || 0); // ✅ THÊM local state
  const [showEditModal, setShowEditModal] = useState(false);

   useEffect(() => {
    loadReactions();
    
    if (!post.username) {
      loadUserName();
    }

    const postRoomId = `post:${post.id}`;
    console.log('PostCard joining room:', postRoomId);
    socketIOService.joinRoom(postRoomId);

    const unsubscribeReaction = socketIOService.subscribe('reaction:toggled', (reaction) => {
      console.log('Reaction toggled event received:', reaction);
      if (reaction && reaction.targetId === post.id) {
        loadReactions();
      }
    });

    // ✅ Subscribe to comment events và UPDATE STATE
    const unsubscribeComment = socketIOService.subscribe('comment:created', (comment) => {
      console.log('📨 PostCard received comment:created event:', comment);
      if (comment && comment.postId === post.id) {
        // ✅ Increment comment count
        setCommentCount(prev => {
          console.log(`💬 Incrementing comment count: ${prev} -> ${prev + 1}`);
          return prev + 1;
        });
        
        // ✅ Nếu đang mở comment section, trigger reload trong CommentSection
        if (showComments) {
          console.log('Reloading comments for open section');
          // Trigger event để CommentSection reload
          window.dispatchEvent(new CustomEvent('reload-comments', { 
            detail: { postId: post.id } 
          }));
        }
      }
    });

    return () => {
      unsubscribeReaction();
      unsubscribeComment();
      
      console.log('PostCard leaving room:', postRoomId);
      socketIOService.leaveRoom(postRoomId);
    };
  }, [post.id, post.userId, post.username, showComments]);

  // ✅ Sync commentCount với prop khi post update
  useEffect(() => {
    setCommentCount(post.commentCount || 0);
  }, [post.commentCount]);


  const loadReactions = async () => {
    try {
      const response = await postApiService.getReactionsByTargetId(post.id);
      // console.log('Loaded reactions for post', post.id, response);
      setReactions(response.result || []);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  // ✅ Load user name and store in state (only if not already in post)
    const loadUserName = async () => {
      try {
        const response = await apiService.getUser(post.userId); // Changed from currentUserId to post.userId
        const fullName = `${response.result.firstName} ${response.result.lastName}`;
        // console.log('Loaded User Name:', fullName);
        setUserName(fullName);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserName('Unknown User');
      }
    };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setShowEditModal(true);
    handleMenuClose();
  };

  const handlePostUpdated = async (updateData) => {
    try {
      const conn = socketIOService.getConnectionStatus();
      
      if (conn.isPostConnected) {
        // Subscribe to post:updated event
        const unsubscribe = socketIOService.subscribe('post:updated', (updated) => {
          try {
            if (updated && updated.id === post.id) {
              if (onPostUpdate) onPostUpdate(updated);
            }
          } finally {
            unsubscribe();
          }
        });

        // Emit update event with postId as second parameter
        socketIOService.emitPost('post:update', {
          content: updateData.content,
          // Note: File/image updates may need to be handled via REST API
          // if backend doesn't support file uploads via socket
        }, post.id);
      } else {
        // Use REST API
        const response = await postApiService.updatePost(post.id, {
          content: updateData.content,
          imageUrls: updateData.imageUrls,
          fileUrls: updateData.fileUrls,
        });
        
        if (onPostUpdate) {
          onPostUpdate(response.result);
        }
      }
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      try {
        const conn = socketIOService.getConnectionStatus();
        if (conn.isPostConnected) {
          const unsubscribe = socketIOService.subscribe('post:deleted', (deleted) => {
            try {
              if (deleted === post.id) {
                if (onPostDelete) onPostDelete(post.id);
              }
            } finally {
              unsubscribe();
            }
          });

          socketIOService.emitPost('post:delete', post.id);
        } else {
          await postApiService.deletePost(post.id);
          if (onPostDelete) {
            onPostDelete(post.id);
          }
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      } finally {
        setIsDeleting(false);
      }
    }
    handleMenuClose();
  };

  const handleToggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleReactionUpdate = (reaction) => {
    loadReactions();
  };

  const handleDownloadFile = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const isOwner = post.userId === currentUserId;
  
  // Map khớp với enum ReactionType trong Java
  const REACTION_MAPPING = {
    LIKE: '👍',
    LOVE: '❤️',
    HAHA: '😂',
    WOW:  '😮',
    SAD:  '😢',
    ANGRY: '😡'
  };

  const distinctReactions = [
  ...new Set(reactions.map((r) => r.reactionType))
  ].filter((type) => REACTION_MAPPING[type]) // Lọc bỏ nếu type không hợp lệ
  .map((type) => REACTION_MAPPING[type])    // Map từ Enum sang Emoji
  .slice(0, 3); // Chỉ lấy tối đa 3 icon để hiển thị

  return (
  <Fade in timeout={500}>
    <Card 
      className="dark:bg-gray-800 dark:border-gray-700 transition-all duration-300"
      sx={{ 
        mb: 3, 
        opacity: isDeleting ? 0.5 : 1,
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        backgroundImage: 'none', // Xóa gradient mặc định của MUI Dark Mode
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar 
            src={post.userAvatar} 
            alt={userName}
            sx={{ 
              width: 48, 
              height: 48,
              border: '2px solid',
              borderColor: 'primary.light',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {userName?.[0]?.toUpperCase()}
          </Avatar>
        }
        action={
          isOwner && (
            <IconButton 
              onClick={handleMenuOpen} 
              disabled={isDeleting}
              className="dark:text-gray-400 dark:hover:text-white"
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'action.hover',
                  transform: 'rotate(90deg)',
                  transition: 'transform 0.3s ease',
                } 
              }}
            >
              <MoreVertIcon />
            </IconButton>
          )
        }
        title={
          <Typography variant="subtitle1" fontWeight="600" className="dark:text-gray-100" sx={{ color: 'text.primary' }}>
            {userName}
          </Typography>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <ScheduleIcon className="dark:text-gray-400" sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" className="dark:text-gray-400" color="text.secondary">
              {post.createdDate
                ? formatDistanceToNow(new Date(post.createdDate), { addSuffix: true })
                : ''}
            </Typography>
            <Typography variant="caption" sx={{ mx: 0.5, color: 'text.disabled' }} className="dark:text-gray-600">
              •
            </Typography>
            <PublicIcon className="dark:text-gray-400" sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" className="dark:text-gray-400" color="text.secondary">
              Public
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 1, pb: 2 }}>
        {/* Post Content */}
        {post.content && (
          <Typography 
            variant="body1" 
            className="dark:text-gray-200"
            sx={{ 
              mb: 2, 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              fontSize: '0.95rem',
              color: 'text.primary',
            }}
          >
            {post.content}
          </Typography>
        )}

        {/* Image Gallery */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
            <ImageList
              cols={post.imageUrls.length === 1 ? 1 : Math.min(post.imageUrls.length, 2)}
              gap={8}
              sx={{ 
                maxHeight: post.imageUrls.length === 1 ? 600 : 500,
                overflow: 'hidden',
                margin: 0,
              }}
            >
              {post.imageUrls.map((imageUrl, index) => (
                <ImageListItem 
                  key={index}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    position: 'relative',
                    '&:hover': {
                      '& img': { transform: 'scale(1.05)' },
                      '& .image-overlay': { opacity: 1 }
                    }
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    loading="lazy"
                    style={{
                      borderRadius: 8,
                      objectFit: 'cover',
                      width: '100%',
                      height: post.imageUrls.length === 1 ? 'auto' : '280px',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease',
                    }}
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                  <Box
                    className="image-overlay"
                    sx={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5))',
                      opacity: 0, transition: 'opacity 0.3s ease',
                      borderRadius: 2, pointerEvents: 'none',
                    }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {/* File Attachments */}
        {post.fileUrls && post.fileUrls.length > 0 && (
          <Paper 
            elevation={0}
            className="dark:bg-gray-900/50 dark:border-gray-700"
            sx={{ 
              p: 2, mb: 2, 
              backgroundColor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" className="dark:text-gray-300" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
              📎 Attachments ({post.fileUrls.length})
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {post.fileUrls.map((fileUrl, index) => {
                const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
                return (
                  <Chip
                    key={index}
                    label={fileName}
                    icon={<DownloadIcon className="dark:text-blue-400" />}
                    onClick={() => handleDownloadFile(fileUrl)}
                    clickable
                    className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                    sx={{ 
                      mb: 1,
                      backgroundColor: 'white',
                      border: '1px solid',
                      borderColor: 'primary.light',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                );
              })}
            </Stack>
          </Paper>
        )}

        {/* Reaction Summary */}
        {(reactions.length > 0 || post.commentCount > 0) && (
          <Box 
            className="dark:border-gray-700"
            sx={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider',
            }}
          >
            {reactions.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" className="dark:text-gray-400" color="text.secondary" sx={{ ml: 0.5, fontWeight: 500 }}>
                  {reactions.length} {reactions.length === 1 ? 'reaction' : 'reactions'}
                </Typography>
              </Box>
            )}
            {commentCount > 0 && (
              <Typography 
                variant="caption" 
                className="dark:text-gray-400 hover:dark:text-blue-400"
                color="text.secondary"
                sx={{ 
                  fontWeight: 500,
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                }}
                onClick={handleToggleComments}
              >
                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      <Divider className="dark:bg-gray-700" />

      <CardActions sx={{ justifyContent: 'space-around', px: 1, py: 0.5 }}>
        <ReactionButton
          targetId={post.id}
          targetType="POST"
          reactions={reactions}
          currentUserId={currentUserId}
          onReactionUpdate={handleReactionUpdate}
        />

        <Button
          size="medium"
          startIcon={<CommentIcon />}
          onClick={handleToggleComments}
          className={showComments ? 'text-blue-500' : 'dark:text-gray-400 dark:hover:bg-gray-700'}
          sx={{ 
            textTransform: 'none',
            color: showComments ? 'primary.main' : 'text.secondary',
            fontWeight: showComments ? 600 : 500,
            px: 2, py: 1, borderRadius: 2,
            transition: 'all 0.2s ease',
          }}
        >
          Comment
        </Button>

        <Button
          size="medium"
          startIcon={<ShareIcon />}
          className="dark:text-gray-400 dark:hover:bg-gray-700"
          sx={{ 
            textTransform: 'none',
            color: 'text.secondary',
            fontWeight: 500,
            px: 2, py: 1, borderRadius: 2,
            transition: 'all 0.2s ease',
          }}
        >
          Share
        </Button>
      </CardActions>

      {/* Comments Section */}
      <Collapse in={showComments} timeout="auto" unmountOnExit>
        <Divider className="dark:bg-gray-700" />
        <CardContent className="dark:bg-gray-900/40" sx={{ py: 2 }}>
          <CommentList postId={post.id} currentUserId={currentUserId} />
        </CardContent>
      </Collapse>

      {/* Menu for Edit/Delete - GIỮ NGUYÊN LOGIC */}
      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={handleMenuClose}
        PaperProps={{
          className: "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200",
          sx: { backgroundImage: 'none', border: '1px solid', borderColor: 'divider' }
        }}
      >
        <MenuItem onClick={handleEdit} className="dark:hover:bg-gray-700">Edit Post</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }} className="dark:hover:bg-gray-700">
          Delete Post
        </MenuItem>
      </Menu>

      {/* Edit Post Modal - GIỮ NGUYÊN LOGIC */}
      <EditPostModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onPostUpdated={handlePostUpdated}
      />
    </Card>
  </Fade>
  )
};

export default PostCard;

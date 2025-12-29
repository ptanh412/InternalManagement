import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { ReactionButton } from './ReactionButton';
import postApiService from '../../services/postApiService';
import { formatDistanceToNow } from 'date-fns';
import { apiService } from '../../services/apiService';
import socketIOService from '../../services/socketIOService';

const Comment = ({ comment, currentUserId, onCommentUpdate, onCommentDelete, onReply, depth = 0 }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [reactions, setReactions] = useState([]);
  const [userName, setUserName] = useState('');


  useEffect(() => {
    loadReactions();
    loadUserName();

  }, [comment.id, comment.userId]);

  const loadReactions = async () => {
    try {
      const response = await postApiService.getReactionsByTargetId(comment.id);
      setReactions(response.result || []);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };
  // ✅ Load user name and store in state
  const loadUserName = async () => {
    try {
      const response = await apiService.getUser(comment.userId);
      const fullName = `${response.result.firstName} ${response.result.lastName}`;
      console.log('Loaded User Name:', fullName);
      setUserName(fullName);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserName(comment.username || 'Unknown User');
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    try {
      const conn = socketIOService.getConnectionStatus();
      if (conn.isPostConnected) {
        // ✅ Generate requestId
        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // ✅ Emit với format mới (single object)
        socketIOService.emitPost('comment:update', { 
          requestId,
          commentId: comment.id,
          content: editContent, 
          postId: comment.postId 
        });
        
        // Update local state for instant feedback
        if (onCommentUpdate) {
          onCommentUpdate({
            ...comment,
            content: editContent,
            modifiedDate: Date.now() / 1000
          });
        }
        
      } else {
        const response = await postApiService.updateComment(comment.id, {
          content: editContent,
          postId: comment.postId,
        });
        if (onCommentUpdate) {
          onCommentUpdate(response.result);
        }
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const conn = socketIOService.getConnectionStatus();
        if (conn.isPostConnected) {
          const unsubscribe = socketIOService.subscribe('comment:deleted', (deletedId) => {
            try {
              if (deletedId === comment.id) {
                if (onCommentDelete) onCommentDelete(comment.id);
              }
            } finally {
              unsubscribe();
            }
          });

          socketIOService.emitPost('comment:delete', comment.id);
        } else {
          await postApiService.deleteComment(comment.id);
          if (onCommentDelete) {
            onCommentDelete(comment.id);
          }
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
      }
    }
    handleMenuClose();
  };

  const handleReactionUpdate = (reaction) => {
    loadReactions();
  };

  const isOwner = comment.userId === currentUserId;
  const maxDepth = 2; // Limit nesting depth


  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        ml: depth > 0 ? 4 : 0,
        mb: 1,
      }}
    >
      <Avatar
        src={comment.userAvatar}
        alt={comment.username}
        sx={{ width: 32, height: 32 }}
      >
        {userName ? userName[0]?.toUpperCase() : comment.username?.[0]?.toUpperCase() || '?'}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            p: 1.5,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {userName}
              </Typography>
              {isEditing ? (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    size="small"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoFocus
                  />
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={handleSaveEdit} variant="contained">
                      Save
                    </Button>
                    <Button size="small" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {comment.content}
                </Typography>
              )}
            </Box>

            {isOwner && !isEditing && (
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Comment Actions */}
        {!isEditing && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 0.5, ml: 1 }}>
            <ReactionButton
              targetId={comment.id}
              targetType="COMMENT"
              reactions={reactions}
              currentUserId={currentUserId}
              onReactionUpdate={handleReactionUpdate}
            />

            {depth < maxDepth && (
              <Button
                size="small"
                startIcon={<ReplyIcon fontSize="small" />}
                onClick={() => onReply && onReply(comment)}
                sx={{ textTransform: 'none', minWidth: 'auto', p: 0 }}
              >
                Reply
              </Button>
            )}

            <Typography variant="caption" color="text.secondary">
              {comment.createdDate
                ? formatDistanceToNow(new Date(comment.createdDate), { addSuffix: true })
                : ''}
            </Typography>
          </Box>
        )}

        {/* Menu for Edit/Delete */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}>Edit</MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

const CommentInput = ({ postId, parentCommentId = null, onCommentCreated, placeholder = 'Write a comment...' }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // ✅ Generate unique request ID
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const payload = { 
        requestId,
        postId, 
        content: content.trim(), 
        parentCommentId 
      };
      
      const conn = socketIOService.getConnectionStatus();
      if (conn.isPostConnected) {
        console.log('🚀 Emitting comment:create with requestId:', requestId);
        
        // ✅ DON'T subscribe here - let CommentList handle the socket event
        // This prevents duplicate additions
        socketIOService.emitPost('comment:create', payload);
        setContent('');
        console.log('✅ Comment creation emitted, CommentList will handle the event');
      } else {
        console.log('📡 Using REST API to create comment');
        const response = await postApiService.createComment(payload);
        setContent('');
        // ✅ Only call callback when using REST API (not socket)
        if (onCommentCreated) {
          console.log('✅ Calling onCommentCreated callback with:', response.result);
          onCommentCreated(response.result);
        }
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to create comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
          },
        }}
      />
      <IconButton type="submit" disabled={isSubmitting || !content.trim()} color="primary">
        <SendIcon />
      </IconButton>
    </Box>
  );
};

const CommentList = ({ postId, currentUserId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadComments();
    loadUserName();

     // ✅ Subscribe to comment:created
    const unsubscribeCreated = socketIOService.subscribe('comment:created', (newComment) => {
      console.log('📨 CommentList received comment:created event:', newComment);
      if (newComment && newComment.postId === postId) {
        setComments((prev) => {
          const exists = prev.some(c => c.id === newComment.id);
          if (exists) {
            console.log('⚠️ Comment already exists in list, skipping:', newComment.id);
            return prev;
          }
          console.log('✅ Adding new comment to list:', newComment.id);
          return [...prev, newComment];
        });
      }
    });

    // ✅ Subscribe to comment:updated - THÊM PHẦN NÀY
    const unsubscribeUpdated = socketIOService.subscribe('comment:updated', (updatedComment) => {
      console.log('Comment updated event received in CommentList:', updatedComment);
      if (updatedComment && updatedComment.postId === postId) {
        setComments((prev) =>
          prev.map((comment) => 
            comment.id === updatedComment.id ? updatedComment : comment
          )
        );
      }
    });

    // ✅ Subscribe to comment:deleted
    const unsubscribeDeleted = socketIOService.subscribe('comment:deleted', (deleteResponse) => {
      console.log('Comment deleted event received in CommentList:', deleteResponse);
      const commentId = deleteResponse.commentId || deleteResponse;
      const responsePostId = deleteResponse.postId;
      
      if (responsePostId === postId || !responsePostId) {
        setComments((prev) => prev.filter(c => c.id !== commentId));
      }
    });

    return () => {
      // ✅ Cleanup all subscriptions
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [postId, currentUserId]);

  const loadComments = async () => {
    try {
      const response = await postApiService.getCommentsByPostId(postId);
      setComments(response.result || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load user name and store in state
  const loadUserName = async () => {
    try {
      const response = await apiService.getUser(currentUserId);
      const fullName = `${response.result.firstName} ${response.result.lastName}`;
      console.log('Loaded User Name:', fullName);
      setUserName(fullName);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserName('Unknown User');
    }
  };

  const handleCommentCreated = (newComment) => {
    setComments((prev) => {
      // ✅ Check for duplicates before adding
      const exists = prev.some(c => c.id === newComment.id);
      if (exists) {
        console.log('Comment already exists, skipping duplicate:', newComment.id);
        return prev;
      }
      return [...prev, newComment];
    });
    setReplyingTo(null);
  };

  const handleCommentUpdate = (updatedComment) => {
    console.log('Updating comment in list:', updatedComment);
    setComments((prev) =>
      prev.map((comment) => (comment.id === updatedComment.id ? updatedComment : comment))
    );
  };

  const handleCommentDelete = (commentId) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
  };

  // Organize comments into parent and replies
  const parentComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId) => comments.filter((c) => c.parentCommentId === parentId);

  if (loading) {
    return <Typography variant="body2">Loading comments...</Typography>;
  }

  return (
    <Box>
      {/* Main comment input */}
      <CommentInput postId={postId} onCommentCreated={handleCommentCreated} />

      <Divider sx={{ my: 2 }} />

      {/* Comments list */}
      {parentComments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No comments yet. Be the first to comment!
        </Typography>
      ) : (
        <Box>
          {parentComments.map((comment) => (
            <Box key={comment.id}>
              <Comment
                comment={comment}
                currentUserId={currentUserId}
                onCommentUpdate={handleCommentUpdate}
                onCommentDelete={handleCommentDelete}
                onReply={handleReply}
                depth={0}
              />

              {/* Replies */}
              {getReplies(comment.id).map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onCommentUpdate={handleCommentUpdate}
                  onCommentDelete={handleCommentDelete}
                  onReply={handleReply}
                  depth={1}
                />
              ))}

              {/* Reply input */}
              {replyingTo?.id === comment.id && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <CommentInput
                    postId={postId}
                    parentCommentId={comment.id}
                    onCommentCreated={handleCommentCreated}
                    placeholder={`Reply to ${userName}...`}
                  />
                  <Button size="small" onClick={() => setReplyingTo(null)} sx={{ mt: 0.5 }}>
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export { Comment, CommentInput, CommentList };

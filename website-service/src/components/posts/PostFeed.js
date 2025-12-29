import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import postApiService from '../../services/postApiService';
import socketIOService from '../../services/socketIOService';

const PostFeed = ({ departmentId = null, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(departmentId ? 1 : 0); // 0: My Posts, 1: Department Posts

  useEffect(() => {
    // Connect to socket service
    socketIOService.connect();

    // Subscribe to real-time updates
    const unsubscribePostCreated = socketIOService.subscribe('post:created', handlePostCreated);
    const unsubscribePostUpdated = socketIOService.subscribe('post:updated', handlePostUpdated);
    const unsubscribePostDeleted = socketIOService.subscribe('post:deleted', handlePostDeleted);

    // Join department room if departmentId is provided
    if (departmentId) {
      console.log('PostFeed joining department room:', departmentId);
      socketIOService.joinRoom(`department:${departmentId}`);
    }

    return () => {
      console.log('PostFeed cleanup - unsubscribing listeners');
      // Cleanup subscriptions
      unsubscribePostCreated();
      unsubscribePostUpdated();
      unsubscribePostDeleted();

      // Leave room
      if (departmentId) {
        socketIOService.leaveRoom(`department:${departmentId}`);
      }
    };
  }, [departmentId]);

  useEffect(() => {
    loadPosts();
  }, [page, tabValue, departmentId]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (tabValue === 0) {
        // Load my posts
        response = await postApiService.getMyPosts(page, 10);
        console.log('Loaded my posts:', response);
      } else if (departmentId) {
        // Load department posts
        response = await postApiService.getDepartmentPosts(departmentId, page, 10);
      }

      if (response && response.result) {
        setPosts(response.result.data || []);
        setTotalPages(response.result.totalPages || 1);
      } else {
        // Handle empty response gracefully
        setPosts([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      
      // Don't show error for 404 (no posts found) - just show empty state
      if (err.response?.status === 404 || err.response?.status === 400) {
        setPosts([]);
        setTotalPages(1);
        setError(null); // Clear error for "no data" scenarios
      } else if (err.response?.status !== 401) {
        // Only show error for non-auth errors (401 is handled by interceptor)
        setError('Unable to load posts. The post service may not be available.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time event handlers
  const handlePostCreated = useCallback((newPost) => {
    console.log('New post received:', newPost);
    console.log('Post createdDate:', newPost.createdDate, 'Type:', typeof newPost.createdDate);
    console.log('Post modifiedDate:', newPost.modifiedDate, 'Type:', typeof newPost.modifiedDate);
    console.log('Full post object:', JSON.stringify(newPost, null, 2));
    
    // Add new post to the beginning of the list if on first page
    if (page === 1) {
      setPosts((prevPosts) => {
        // Avoid duplicates
        const exists = prevPosts.some((p) => p.id === newPost.id);
        if (exists) return prevPosts;
        return [newPost, ...prevPosts];
      });
    }
  }, [page]);

  const handlePostUpdated = useCallback((updatedPost) => {
    console.log('Post updated:', updatedPost);
    console.log('Updated post createdDate:', updatedPost.createdDate, 'Type:', typeof updatedPost.createdDate);
    console.log('Updated post modifiedDate:', updatedPost.modifiedDate, 'Type:', typeof updatedPost.modifiedDate);
    
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  }, []);

  const handlePostDeleted = useCallback((data) => {
    console.log('Post deleted:', data.postId);
    
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== data.postId));
  }, []);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1); // Reset to first page when switching tabs
  };

  const handlePostCreatedLocally = (newPost) => {
    // Only called for HTTP API fallback (when socket not connected)
    // Socket-created posts are handled by handlePostCreated via 'post:created' event
    console.log('Post created via HTTP API:', newPost);
    if (page === 1) {
      setPosts((prevPosts) => {
        // Avoid duplicates
        const exists = prevPosts.some((p) => p.id === newPost.id);
        if (exists) return prevPosts;
        return [newPost, ...prevPosts];
      });
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handlePostDelete = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

 return (
    <Box className="dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          className="dark:text-white text-gray-800" 
          gutterBottom 
          fontWeight="bold"
        >
          Posts Feed
        </Typography>

        {/* Tabs section */}
        {departmentId && (
          <Paper 
            className="dark:bg-gray-800 dark:border-gray-700 transition-all"
            elevation={0}
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              backgroundImage: 'none'
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  fontWeight: 600,
                  transition: 'color 0.2s',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                },
                // Chỉnh màu chữ tab khi ở Dark Mode
                '& .dark & .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&.Mui-selected': {
                    color: '#60a5fa', // blue-400
                  },
                }
              }}
            >
              <Tab label="My Posts" />
              <Tab label="Department Posts" />
            </Tabs>
          </Paper>
        )}

        {/* Create Post Form */}
        <CreatePost
          onPostCreated={handlePostCreatedLocally}
          departmentId={tabValue === 1 ? departmentId : null}
          currentUser={currentUser}
        />

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="warning" 
            className="dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800/50" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'warning.light'
            }} 
            onClose={() => setError(null)}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">{error}</Typography>
              <Typography variant="caption" display="block">
                You can still create posts. They will be saved when the service is available.
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress thickness={4} size={40} />
          </Box>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <Box 
            className="dark:bg-gray-800/30 dark:border-gray-800"
            sx={{ 
              textAlign: 'center', 
              py: 10, 
              px: 2,
              borderRadius: 4,
              border: '2px dashed',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" className="text-gray-600 dark:text-gray-300" fontWeight="600">
              No posts yet
            </Typography>
            <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
              Be the first to share something with your colleagues!
            </Typography>
          </Box>
        )}

        {/* Posts List */}
        {!loading && posts.length > 0 && (
          <Box className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.userId}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, pb: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontWeight: 600,
                      // Màu mặc định cho Dark Mode qua class Tailwind dark
                      className: 'dark:text-gray-300 dark:hover:bg-gray-800',
                      '&.Mui-selected': {
                        boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                      }
                    },
                    // Ép kiểu màu trắng cho con số trong dark mode nếu MUI theme chưa config
                    '& .MuiPaginationItem-page, & .MuiPaginationItem-ellipsis': {
                      color: 'inherit', 
                      className: 'dark:text-white'
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PostFeed;

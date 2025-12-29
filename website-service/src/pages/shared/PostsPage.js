import React from 'react';
import { Box } from '@mui/material';
import { PostFeed } from '../../components/posts';
import { useAuth } from '../../hooks/useAuth';

const PostsPage = () => {
  const { user } = useAuth();

  // Allow access even without login - use guest mode
  const currentUser = user ? {
    userId: user.userId || localStorage.getItem('userId'),
    username: user.name || localStorage.getItem('username') || 'Guest',
    avatar: user.avatar || localStorage.getItem('avatar'),
  } : {
    userId: localStorage.getItem('userId') || 'guest',
    username: localStorage.getItem('username') || 'Guest',
    avatar: localStorage.getItem('avatar'),
  };

  // Get departmentId with fallback
  const departmentId = user?.departmentName || localStorage.getItem('departmentId') || null;

  console.log('PostsPage - Current User:', currentUser);
  console.log('PostsPage - Department ID:', departmentId);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }} className="dark:bg-gray-900">
      <PostFeed
        currentUser={currentUser} 
        departmentId={departmentId} 
      />
    </Box>
  );
};

export default PostsPage;
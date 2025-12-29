import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
  Chip,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Photo as PhotoIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import postApiService from '../../services/postApiService';
import { apiService } from '../../services/apiService';
import socketIOService from '../../services/socketIOService';
import { create } from '@mui/material/styles/createTransitions';

const CreatePost = ({ onPostCreated, departmentId, currentUser }) => {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file attachment
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachmentFiles((prev) => [...prev, ...files]);
  };

  // Remove image
  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove file
  const removeFile = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files to file-service
  const uploadFiles = async (files, type = 'image') => {
    const uploadedUrls = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        // Assuming file-service endpoint
        const response = await apiService.uploadFile(formData, type);
        console.log(`Uploaded ${type}:`, response);
        if (response.code === 1000) {
        //   const data = await response.json();
          uploadedUrls.push(response.result.url);
        }
      } catch (error) {
        console.error(`Error uploading ${type}:`, error);
      }
    }
    return uploadedUrls;
  };

  // Handle post submission
  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0 && attachmentFiles.length === 0) {
      return;
    }

    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate call');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const uploadedImages = await uploadFiles(imageFiles, 'image');
      const uploadedFiles = await uploadFiles(attachmentFiles, 'file');

      // ✅ Generate unique request ID
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const postData = {
        requestId, // ✅ THÊM
        content: content.trim(),
        imageUrls: uploadedImages,
        fileUrls: uploadedFiles,        
        departmentId: departmentId,
      };

      const conn = socketIOService.getConnectionStatus();
      console.log('Creating post via socket:', conn);
      
      if (conn.isPostConnected) {
        console.log('Emitting post:create event with requestId:', requestId);
        socketIOService.emitPost('post:create', postData);

        // Clear form
        setContent('');
        setImageFiles([]);
        setAttachmentFiles([]);
        setImagePreviews([]);
        setImageUrls([]);
        setFileUrls([]);
      } else {
        // HTTP fallback
        const response = await postApiService.createPost(postData);
        
        setContent('');
        setImageFiles([]);
        setAttachmentFiles([]);
        setImagePreviews([]);
        setImageUrls([]);
        setFileUrls([]);

        if (onPostCreated) {
          onPostCreated(response.result);
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      
      if (error.response?.status === 404 || error.response?.status === 503) {
        alert('Post service is currently unavailable. Please try again later.');
      } else if (error.response?.status !== 401) {
        alert('Failed to create post. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card 
      className="dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300"
      sx={{ 
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        backgroundImage: 'none', // Quan trọng cho MUI Card trong Dark Mode
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar
            src={currentUser?.avatar}
            sx={{ 
              width: 48, height: 48,
              border: '2px solid',
              borderColor: 'primary.light',
            }}
          >
            {currentUser?.username?.[0]?.toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={8}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="outlined"
              className="dark:text-white dark:placeholder-gray-400" 
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  // Sử dụng Tailwind class thay vì hardcode grey.50
                  backgroundColor: 'rgba(0,0,0,0.02)', 
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'transparent',
                  },
                  // Chỉnh sửa border và màu chữ cho Dark Mode qua class Tailwind
                  '& fieldset': { borderColor: 'divider' },
                },
                // Dark mode CSS cho input text
                '& .MuiInputBase-input': {
                  color: 'inherit',
                  className: 'dark:text-gray-100',
                }
              }}
              // Thêm class này để TextField nhận style dark mode của Tailwind
              inputProps={{ className: 'dark:text-white placeholder-gray-400' }}
            />

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {imagePreviews.map((preview, index) => (
                  <Box
                    key={index}
                    className="dark:border-gray-600"
                    sx={{
                      position: 'relative', width: 120, height: 120,
                      borderRadius: 2, overflow: 'hidden',
                      border: '1px solid #eee',
                    }}
                  >
                    <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Box
                      className="delete-overlay"
                      sx={{
                        position: 'absolute', inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => removeImage(index)}
                        sx={{ backgroundColor: 'white', '&:hover': { backgroundColor: '#f5f5f5' } }}
                      >
                        <CloseIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* File Attachments */}
            {attachmentFiles.length > 0 && (
              <Box 
                className="dark:bg-gray-800/50 dark:border-gray-700"
                sx={{ 
                  mt: 2, p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 2, border: '1px dashed', borderColor: 'grey.300',
                }}
              >
                <Typography 
                  variant="caption" 
                  className="dark:text-gray-400"
                  sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'text.secondary' }}
                >
                  📎 {attachmentFiles.length} file(s) attached
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {attachmentFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => removeFile(index)}
                      size="small"
                      className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                      sx={{ backgroundColor: 'white', border: '1px solid', borderColor: 'grey.300' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              className="dark:border-gray-700"
              sx={{
                mt: 2.5, pt: 2,
                borderTop: '1px solid', borderColor: 'divider',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" multiple style={{ display: 'none' }} />
                <Button
                  variant="text"
                  startIcon={<PhotoIcon />}
                  onClick={() => imageInputRef.current?.click()}
                  className="dark:hover:bg-gray-800"
                  sx={{
                    textTransform: 'none', color: 'success.main', fontWeight: 600,
                    borderRadius: 2, px: 2,
                  }}
                >
                  Photo
                </Button>

                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} />
                <Button
                  variant="text"
                  startIcon={<AttachFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  className="dark:hover:bg-gray-800"
                  sx={{
                    textTransform: 'none', color: 'info.main', fontWeight: 600,
                    borderRadius: 2, px: 2,
                  }}
                >
                  File
                </Button>
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && imageFiles.length === 0 && attachmentFiles.length === 0)}
                endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{
                  textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                }}
                className ="dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreatePost;

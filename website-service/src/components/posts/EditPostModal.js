import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';

const EditPostModal = ({ open, onClose, post, onPostUpdated }) => {
  const [content, setContent] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    if (post && open) {
      setContent(post.content || '');
      setExistingImages(post.imageUrls || []);
      setExistingFiles(post.fileUrls || []);
      setNewImages([]);
      setNewFiles([]);
      setPreviewImages([]);
    }
  }, [post, open]);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setNewImages((prev) => [...prev, ...files]);

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...previews]);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (index) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && existingImages.length === 0 && newImages.length === 0) {
      alert('Please add some content or images');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        content: content.trim(),
        imageUrls: existingImages,
        fileUrls: existingFiles,
        newImages: newImages.length > 0 ? newImages : undefined,
        newFiles: newFiles.length > 0 ? newFiles : undefined,
      };

      if (onPostUpdated) {
        await onPostUpdated(updateData);
      }

      handleClose();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Cleanup preview URLs
    previewImages.forEach((url) => URL.revokeObjectURL(url));
    onClose();
  };

  const getFileName = (url) => {
    return url.split('/').pop() || 'File';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="600">
          Edit Post
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Content Input */}
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Current Images
            </Typography>
            <ImageList cols={3} gap={8} sx={{ maxHeight: 300 }}>
              {existingImages.map((imageUrl, index) => (
                <ImageListItem key={`existing-${index}`}>
                  <img
                    src={imageUrl}
                    alt={`Existing ${index + 1}`}
                    loading="lazy"
                    style={{
                      borderRadius: 8,
                      objectFit: 'cover',
                      width: '100%',
                      height: 150,
                    }}
                  />
                  <ImageListItemBar
                    sx={{
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      borderRadius: '8px 8px 0 0',
                    }}
                    position="top"
                    actionIcon={
                      <IconButton
                        sx={{ color: 'white' }}
                        onClick={() => handleRemoveExistingImage(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {/* New Images Preview */}
        {previewImages.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              New Images
            </Typography>
            <ImageList cols={3} gap={8} sx={{ maxHeight: 300 }}>
              {previewImages.map((previewUrl, index) => (
                <ImageListItem key={`new-${index}`}>
                  <img
                    src={previewUrl}
                    alt={`New ${index + 1}`}
                    loading="lazy"
                    style={{
                      borderRadius: 8,
                      objectFit: 'cover',
                      width: '100%',
                      height: 150,
                    }}
                  />
                  <ImageListItemBar
                    sx={{
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      borderRadius: '8px 8px 0 0',
                    }}
                    position="top"
                    actionIcon={
                      <IconButton
                        sx={{ color: 'white' }}
                        onClick={() => handleRemoveNewImage(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {/* Existing Files */}
        {existingFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Current Files
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {existingFiles.map((fileUrl, index) => (
                <Chip
                  key={`existing-file-${index}`}
                  label={getFileName(fileUrl)}
                  onDelete={() => handleRemoveExistingFile(index)}
                  deleteIcon={<DeleteIcon />}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* New Files */}
        {newFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              New Files
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {newFiles.map((file, index) => (
                <Chip
                  key={`new-file-${index}`}
                  label={file.name}
                  onDelete={() => handleRemoveNewFile(index)}
                  deleteIcon={<DeleteIcon />}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Upload Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<ImageIcon />}
            sx={{ borderRadius: 2 }}
          >
            Add Images
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>

          <Button
            variant="outlined"
            component="label"
            startIcon={<AttachFileIcon />}
            sx={{ borderRadius: 2 }}
          >
            Add Files
            <input
              type="file"
              hidden
              multiple
              onChange={handleFileChange}
            />
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <UploadIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {isSubmitting ? 'Updating...' : 'Update Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostModal;

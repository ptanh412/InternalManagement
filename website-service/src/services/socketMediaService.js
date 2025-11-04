// Enhanced Socket-based Media Message Service for Website Service
// Based on web-app implementation

/**
 * Upload file and send media message via socket
 */
export const sendSocketMediaMessage = async (conversationId, file, caption = null) => {
  try {
    console.log("📁 Starting media message upload and send process");

    // Step 1: Upload file to file service via HTTP
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const uploadResponse = await fetch('http://localhost:8888/api/v1/file/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    const uploadData = await uploadResponse.json();
    const fileInfo = uploadData.result;

    console.log("📁 File uploaded successfully:", fileInfo.fileName);

    // Step 2: Send media message via socket
    const mediaMessageData = {
      conversationId: conversationId,
      caption: caption,
      fileUrl: fileInfo.url,
      fileName: fileInfo.originalFileName,
      fileType: file.type,
      fileSize: file.size,
    };

    console.log("📁 Media message data being sent:", mediaMessageData);

    // Import and use chatSocketService
    const { default: chatSocketService } = await import('./chatSocketService');
    
    return new Promise((resolve, reject) => {
      // Listen for success response
      const successHandler = (response) => {
        console.log("📁 Media message sent successfully:", response);
        chatSocketService.off('media-message-error', errorHandler);
        resolve(response);
      };

      const errorHandler = (error) => {
        console.error("📁 Error sending media message:", error);
        chatSocketService.off('media-message-success', successHandler);
        reject(new Error(error.error || error));
      };

      chatSocketService.on('media-message-success', successHandler);
      chatSocketService.on('media-message-error', errorHandler);

      // Emit the media message event
      if (chatSocketService.isSocketConnected()) {
        chatSocketService.sendMediaMessage(mediaMessageData);
      } else {
        reject(new Error('Socket not connected'));
      }
    });

  } catch (error) {
    console.error("📁 Error in sendSocketMediaMessage:", error);
    throw error;
  }
};

/**
 * Upload file and send media reply via socket
 */
export const sendSocketMediaReply = async (conversationId, file, replyToMessageId, caption = null) => {
  try {
    console.log("📁 Starting media reply upload and send process");

    // Step 1: Upload file to file service via HTTP
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const uploadResponse = await fetch('http://localhost:8888/api/v1/file/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    const uploadData = await uploadResponse.json();
    const fileInfo = uploadData.result;

    console.log("📁 File uploaded successfully for reply:", fileInfo.fileName);

    // Step 2: Send media reply via socket
    const mediaReplyData = {
      conversationId: conversationId,
      replyToMessageId: replyToMessageId,
      caption: caption,
      fileUrl: fileInfo.url,
      fileName: fileInfo.originalFileName,
      fileType: file.type,
      fileSize: file.size,
    };

    console.log("📁 Media reply data being sent:", mediaReplyData);

    // Import and use chatSocketService
    const { default: chatSocketService } = await import('./chatSocketService');
    
    return new Promise((resolve, reject) => {
      // Listen for success response
      const successHandler = (response) => {
        console.log("📁 Media reply sent successfully:", response);
        chatSocketService.off('media-reply-error', errorHandler);
        resolve(response);
      };

      const errorHandler = (error) => {
        console.error("📁 Error sending media reply:", error);
        chatSocketService.off('media-reply-success', successHandler);
        reject(new Error(error.error || error));
      };

      chatSocketService.on('media-reply-success', successHandler);
      chatSocketService.on('media-reply-error', errorHandler);

      // Emit the media reply event
      if (chatSocketService.isSocketConnected()) {
        chatSocketService.sendMediaReply(mediaReplyData);
      } else {
        reject(new Error('Socket not connected'));
      }
    });

  } catch (error) {
    console.error("📁 Error in sendSocketMediaReply:", error);
    throw error;
  }
};

/**
 * Helper function to handle file selection and determine message type
 */
export const handleFileSelect = (file) => {
  console.log("📁 File selected:", file.name, file.type, file.size);
  
  const fileInfo = {
    name: file.name,
    type: file.type,
    size: file.size,
    isImage: file.type.startsWith('image/'),
    isVideo: file.type.startsWith('video/'),
    isAudio: file.type.startsWith('audio/'),
    isDocument: !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')
  };

  return fileInfo;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file type icon based on file type
 */
export const getFileTypeIcon = (fileType) => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦';
  return '📎';
};
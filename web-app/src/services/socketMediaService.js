// Frontend Socket-based Media Message Service
// Add these functions to your Chat.jsx or create a separate socketMediaService.js

import { getToken } from "./localStorageService";

/**
 * Upload file and send media message via socket
 */
const sendSocketMediaMessage = async (socketRef, conversationId, file, caption = null) => {
  
  try {
    console.log("📁 Starting media message upload and send process");

    // Step 1: Upload file to file service via HTTP
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch('http://localhost:8888/api/v1/file/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
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

    console.log("📁 Debug - mediaMessageData being sent:", JSON.stringify(mediaMessageData, null, 2));
    console.log("📁 Debug - fileInfo from upload:", JSON.stringify(fileInfo, null, 2));

    return new Promise((resolve, reject) => {
      // Listen for success response
      socketRef.current.once("media-message-success", (response) => {
        console.log("📁 Media message sent successfully:", response);
        resolve(response);
      });

      // Listen for error response
      socketRef.current.once("media-message-error", (error) => {
        console.error("📁 Error sending media message:", error);
        reject(new Error(error));
      });

      // Emit the media message event
      socketRef.current.emit("send-media-message", mediaMessageData);
      console.log("📁 Socket emitting: send-media-message", mediaMessageData);
    });

  } catch (error) {
    console.error("📁 Error in sendSocketMediaMessage:", error);
    throw error;
  }
};

/**
 * Upload file and send media reply via socket
 */
const sendSocketMediaReply = async (socketRef, conversationId, file, replyToMessageId, caption = null) => {
  try {
    console.log("📁 Starting media reply upload and send process");

    // Step 1: Upload file to file service via HTTP
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch('http://localhost:8888/api/v1/file/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
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
      caption: caption,
      fileUrl: fileInfo.fileUrl,
      fileName: fileInfo.fileName,
      fileType: file.type,
      fileSize: file.size,
      replyToMessageId: replyToMessageId,
    };

    return new Promise((resolve, reject) => {
      // Listen for success response
      socketRef.current.once("media-reply-success", (response) => {
        console.log("📁 Media reply sent successfully:", response);
        resolve(response);
      });

      // Listen for error response
      socketRef.current.once("media-reply-error", (error) => {
        console.error("📁 Error sending media reply:", error);
        reject(new Error(error));
      });

      // Emit the media reply event
      socketRef.current.emit("send-media-reply", mediaReplyData);
      console.log("📁 Socket emitting: send-media-reply", mediaReplyData);
    });

  } catch (error) {
    console.error("📁 Error in sendSocketMediaReply:", error);
    throw error;
  }
};

/**
 * Upload group avatar image and return URL
 */
const uploadGroupAvatar = async (file) => {
  try {
    console.log("🖼️ Starting group avatar upload process");

    // Validate file type (only images allowed for avatar)
    const allowedImageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
    ];

    if (!allowedImageTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please select an image file (JPEG, PNG, GIF, or WebP).');
    }

    // Validate file size (5MB limit for avatars)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Avatar image size too large. Please select an image smaller than 5MB.');
    }

    // Step 1: Upload file to file service via HTTP
    const formData = new FormData();
    formData.append('file', file);

    console.log("Token:", getToken());

    const uploadResponse = await fetch('http://localhost:8888/api/v1/file/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload avatar image');
    }

    const uploadData = await uploadResponse.json();
    const fileInfo = uploadData.result;

    console.log("🖼️ Avatar uploaded successfully:", fileInfo.fileName);
    console.log("🖼️ Avatar URL:", fileInfo.url);

    return {
      url: fileInfo.url,
      fileName: fileInfo.fileName || fileInfo.originalFileName,
      fileSize: file.size
    };

  } catch (error) {
    console.error("🖼️ Error in uploadGroupAvatar:", error);
    throw error;
  }
};

/**
 * Delete media message via socket
 */
const deleteSocketMediaMessage = async (socketRef, messageId) => {
  try {
    console.log("📁 Starting media message deletion:", messageId);

    return new Promise((resolve, reject) => {
      // Listen for success response
      socketRef.current.once("delete-media-success", (deletedMessageId) => {
        console.log("📁 Media message deleted successfully:", deletedMessageId);
        resolve(deletedMessageId);
      });

      // Listen for error response
      socketRef.current.once("delete-media-error", (error) => {
        console.error("📁 Error deleting media message:", error);
        reject(new Error(error));
      });

      // Emit the delete media message event
      socketRef.current.emit("delete-media-message", messageId);
      console.log("📁 Socket emitting: delete-media-message", messageId);
    });

  } catch (error) {
    console.error("📁 Error in deleteSocketMediaMessage:", error);
    throw error;
  }
};

/**
 * Handle file selection and validation
 */
const handleFileSelect = (file) => {
  // Validate file type
  const supportedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Videos
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
    // Audio
    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
    // Documents
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];

  if (!supportedTypes.includes(file.type)) {
    throw new Error('Unsupported file type. Please select an image, video, audio, or document file.');
  }

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size too large. Please select a file smaller than 10MB.');
  }

  return true;
};

/**
 * Get file type category for display
 */
const getFileTypeCategory = (mediaType) => {
  if (!mediaType) return 'file';

  if (mediaType.startsWith('image/')) return 'image';
  if (mediaType.startsWith('video/')) return 'video';
  if (mediaType.startsWith('audio/')) return 'audio';
  if (mediaType.includes('pdf') || mediaType.includes('document') ||
      mediaType.includes('text') || mediaType.includes('application/')) return 'document';

  return 'file';
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Socket event listeners for media messages (add these to your useEffect in Chat.jsx)
// const setupMediaSocketListeners = () => {
//   if (!socketRef.current) return;

//   // Listen for message deletion events
//   socketRef.current.on("message-deleted", (deletionData) => {
//     console.log("📁 Message deletion received:", deletionData);

//     try {
//       const deletionInfo = JSON.parse(deletionData);

//       // Remove the deleted message from the UI
//       setMessagesMap((prev) => {
//         const conversationMessages = prev[deletionInfo.conversationId] || [];
//         const updatedMessages = conversationMessages.filter(
//           msg => msg.id !== deletionInfo.messageId
//         );

//         return {
//           ...prev,
//           [deletionInfo.conversationId]: updatedMessages,
//         };
//       });

//       // Update conversation list if needed
//       setConversations((prev) =>
//         prev.map((conv) => {
//           if (conv.id === deletionInfo.conversationId &&
//               conv.lastMessage?.id === deletionInfo.messageId) {
//             // Find new last message
//             const messages = messagesMap[deletionInfo.conversationId] || [];
//             const remainingMessages = messages.filter(msg => msg.id !== deletionInfo.messageId);
//             const newLastMessage = remainingMessages[remainingMessages.length - 1] || null;

//             return {
//               ...conv,
//               lastMessage: newLastMessage,
//             };
//           }
//           return conv;
//         })
//       );

//     } catch (error) {
//       console.error("📁 Error parsing deletion data:", error);
//     }
//   });


// Export the functions
export {
  sendSocketMediaMessage,
  sendSocketMediaReply,
  deleteSocketMediaMessage,
  uploadGroupAvatar,
  handleFileSelect,
  getFileTypeCategory,
  formatFileSize,
};

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  TextField,
  Typography,
  Paper,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  Snackbar,
  Chip,
  useTheme,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import ForwardIcon from "@mui/icons-material/Forward";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplyIcon from "@mui/icons-material/Reply";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import DescriptionIcon from "@mui/icons-material/Description";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import ArticleIcon from "@mui/icons-material/Article";
import TableChartIcon from "@mui/icons-material/TableChart";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import InfoIcon from "@mui/icons-material/Info";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Menu, MenuItem, ListItemIcon } from "@mui/material";
import ConversationInfoPanel from "../components/ConversationInfoPanel";
import Scene from "./Scene";
import NewChatPopover from "../components/NewChatPopover";
import { search } from "../services/userService";
import {
  getMyConversations,
  createConversation,
  getMessages,
  createMessage,
  forwardMessage,
  editMessage,
} from "../services/chatService";
import { io } from "socket.io-client";
import { getToken } from "../services/localStorageService";
import { getCurrentUserId } from "../services/tokenService";
import {
  sendSocketMediaMessage,
  sendSocketMediaReply,
  handleFileSelect,

} from "../services/socketMediaService";
// Forward Dialog for selecting conversation to forward message
const ForwardDialog = ({ open, onClose, conversations, onForward, currentConversation }) => {

  const [selected, setSelected] = useState(null);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Select conversation to forward</DialogTitle>
      <DialogContent>
        <List>
          {conversations.filter(conv => conv.id !== currentConversation?.id).map(conv => (
            <ListItem
              button
              key={conv.id}
              selected={selected === conv.id}
              onClick={() => setSelected(conv.id)}
            >
              <ListItemText primary={conv.conversationName || conv.title || conv.id} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => { if (selected) onForward(selected); }} disabled={!selected} variant="contained">Forward</Button>
      </DialogActions>
    </Dialog>
  );
}
// Component to display read receipts for group messages
const ReadReceipts = ({ message, conversationType, currentUserId }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Only show read receipts for group conversations and messages sent by current user
  if (conversationType !== 'GROUP' || !message.me || message.status !== 'SEEN') {
    return null;
  }

  const readers = message.readers || [];
  const readersCount = readers.length;

  if (readersCount === 0) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: '0.65rem' }}
      >
        ✔️ Sent
      </Typography>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          '&:hover': { opacity: 0.7 }
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Typography
          variant="caption"
          color="primary"
          sx={{ fontSize: '0.65rem', fontWeight: 500 }}
        >
          ✔️✔️ Read by {readersCount}
        </Typography>
        <VisibilityIcon sx={{ fontSize: 12, color: 'primary.main' }} />
      </Box>

      {showDetails && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            mb: 1,
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            minWidth: 200,
            maxWidth: 250,
            boxShadow: 2,
            zIndex: 1000
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
            Read by:
          </Typography>
          {readers.map((reader, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Avatar
                src={reader.avatar}
                sx={{ width: 16, height: 16 }}
              >
                {reader.username?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                {reader.username}
              </Typography>
            </Box>
          ))}
          {message.readDate && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.65rem', mt: 1, display: 'block' }}
            >
              at {new Date(message.readDate).toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default function Chat({ darkMode, onToggleDarkMode }) {
  const theme = useTheme();
  const [message, setMessage] = useState("");
  const [newChatAnchorEl, setNewChatAnchorEl] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [moreActionsAnchorEl, setMoreActionsAnchorEl] = useState(null);
  const [selectedMessageForActions, setSelectedMessageForActions] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // For tracking which message is being replied to
  const [reactionPickerAnchorEl, setReactionPickerAnchorEl] = useState(null);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);

  const [reactionDetailsOpen, setReactionDetailsOpen] = useState(false);
  const [selectedMessageForReactionDetails, setSelectedMessageForReactionDetails] = useState(null);
  const [reactionDetailsData, setReactionDetailsData] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState({}); // Store pinned messages by conversation ID
  const [showPinnedMessages, setShowPinnedMessages] = useState(false); // Toggle pinned messages view
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Conversation info dialog states
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [conversationAttachments, setConversationAttachments] = useState([]);

  // Add members dialog states
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [selectedUsersForAdd, setSelectedUsersForAdd] = useState([]);
  const [searchUsersResults, setSearchUsersResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // User scroll tracking
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastMessageCountRef = useRef(0);
  const lastConversationIdRef = useRef(null);

  // Media file handling states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  //edit message
  const [editingMessage, setEditingMessage] = useState(null);
  const messageContainerRef = useRef(null);
  const socketRef = useRef(null); // Function to scroll to the bottom of the message container

  const scrollToBottom = useCallback((force = false) => {
    if (messageContainerRef.current) {
      // Only scroll if forced, user is near bottom, or it's a new message
      if (force || isNearBottom || !isUserScrolling) {
        console.log('Scrolling to bottom:', { force, isNearBottom, isUserScrolling }); // Debug
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
      } else {
        console.log('Scroll to bottom blocked - user is scrolling up'); // Debug
      }
    }
  }, [isNearBottom, isUserScrolling]);

  // Check if user is near bottom of chat
  const checkScrollPosition = useCallback(() => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      const threshold = 50; // Reduced threshold for more accurate detection
      const nearBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsNearBottom(nearBottom);
    }
  }, []);

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    setIsUserScrolling(true);
    checkScrollPosition();

    console.log('User scrolling detected'); // Debug logging

    // Clear any existing timeout
    if (handleScroll.timeoutId) {
      clearTimeout(handleScroll.timeoutId);
    }

    // Reset user scrolling flag after user stops scrolling
    handleScroll.timeoutId = setTimeout(() => {
      setIsUserScrolling(false);
      checkScrollPosition(); // Check position again when scrolling stops
      console.log('User stopped scrolling'); // Debug logging
    }, 150); // Reduced timeout for better responsiveness
  }, [checkScrollPosition]);

  // New chat popover handlers
  const handleNewChatClick = (event) => {
    setNewChatAnchorEl(event.currentTarget);
  };

  const handleCloseNewChat = () => {
    setNewChatAnchorEl(null);
  };

  const handleSelectNewChatUser = async (user) => {
    const response = await createConversation({
      type: "DIRECT",
      participantIds: [user.userId],
    });

    const newConversation = response?.data?.result;

    console.log("New conversation created:", newConversation);

    // Check if we already have a conversation with this user
    const existingConversation = conversations.find(
      (conv) => conv.id === newConversation.id
    );

    if (existingConversation) {
      // If conversation exists, just select it
      setSelectedConversation(existingConversation);
    } else {
      // Add to conversations list
      setConversations((prevConversations) => [
        newConversation,
        ...prevConversations,
      ]);

      // Select this new conversation
      setSelectedConversation(newConversation);
    }
  };

  // Handler for creating group conversation via socket
  const handleCreateGroupConversation = async (groupData) => {
    console.log("🔥 Creating group conversation:", groupData);

    if (!socketRef.current) {
      throw new Error("Socket connection not available");
    }

    return new Promise((resolve, reject) => {
      // Set up one-time listeners for the response
      const successHandler = (response) => {
        console.log("🔥 Group creation success:", response);
        socketRef.current.off("create-group-error", errorHandler);
        resolve(response);
      };

      const errorHandler = (error) => {
        console.error("🔥 Group creation error:", error);
        socketRef.current.off("create-group-success", successHandler);
        reject(new Error(error));
      };

      socketRef.current.once("create-group-success", successHandler);
      socketRef.current.once("create-group-error", errorHandler);

      // Emit the create group event
      socketRef.current.emit("create-group-conversation", {
        groupName: groupData.groupName,
        groupAvatar: groupData.groupAvatar || null,
        participantIds: groupData.participantIds
      });

      console.log("🔥 Emitted create-group-conversation event");
    });
  };

  // Handler for adding members to group conversation via socket
  const handleAddMembersToGroup = async (conversationId, participantIds) => {
    console.log("🔥 Adding members to group:", { conversationId, participantIds });

    if (!socketRef.current) {
      throw new Error("Socket connection not available");
    }

    return new Promise((resolve, reject) => {
      // Set up one-time listeners for the response
      const successHandler = (response) => {
        console.log("🔥 Add members success:", response);
        socketRef.current.off("add-participants-error", errorHandler);

        // If response contains updated participants list, use it to update state
        // Update the selected conversation with new participants
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(prevConversation => ({
            ...prevConversation,
            participants: response.participants
          }));

          console.log("🔥 Updated selected conversation with new participants:", response.participants);
          console.log("Participants after add member:", selectedConversation.participants);
        }

        // Update conversations list with new participants
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                participants: response.participants
              };
            }
            return conv;
          })
        );


        resolve(response);
      };

      const errorHandler = (error) => {
        console.error("🔥 Add members error:", error);
        socketRef.current.off("add-participants-success", successHandler);
        reject(new Error(error));
      };

      socketRef.current.once("add-participants-success", successHandler);
      socketRef.current.once("add-participants-error", errorHandler);

      // Emit the add participants event
      socketRef.current.emit("add-participants", {
        conversationId: conversationId,
        participantIds: participantIds
      });

      console.log("🔥 Emitted add-participants event");
    });
  };

  // Function to remove participants from group via WebSocket
  const removeParticipantsFromGroup = (conversationId, participantIds) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error("Socket not connected"));
        return;
      }

      const successHandler = (response) => {
        console.log("🔥 Participants removed successfully:", response);
        socketRef.current.off("remove-participants-error", errorHandler);

        // Immediately update the selected conversation to remove the participants
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(prevConversation => ({
            ...prevConversation,
            participants: prevConversation.participants.filter(
              participant => !participantIds.includes(participant.userId)
            )
          }));
        }

        // Update conversations list to reflect the change
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                participants: conv.participants?.filter(
                  participant => !participantIds.includes(participant.userId)
                ) || []
              };
            }
            return conv;
          })
        );

        resolve(response);
      };

      const errorHandler = (error) => {
        console.error("🔥 Error removing participants:", error);
        socketRef.current.off("remove-participants-success", successHandler);
        reject(new Error(error || "Failed to remove participants"));
      };

      socketRef.current.once("remove-participants-success", successHandler);
      socketRef.current.once("remove-participants-error", errorHandler);

      // Emit the remove participants event
      socketRef.current.emit("remove-participants", {
        conversationId: conversationId,
        participantIds: participantIds
      });

      console.log("🔥 Emitted remove-participants event");
    });
  };

  // Function to leave group via WebSocket
  const leaveGroup = (conversationId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error("Socket not connected"));
        return;
      }

      const successHandler = (response) => {
        console.log("🔥 Left group successfully:", response);
        socketRef.current.off("leave-group-error", errorHandler);

        // Remove the conversation from the list when user leaves
        setConversations(prevConversations =>
          prevConversations.filter(conv => conv.id !== conversationId)
        );

        // Clear selected conversation if it was the one the user left
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(null);
          setMessagesMap({});
        }

        resolve(response);
      };

      const errorHandler = (error) => {
        console.error("🔥 Error leaving group:", error);
        socketRef.current.off("leave-group-success", successHandler);
        reject(new Error(error || "Failed to leave group"));
      };

      socketRef.current.once("leave-group-success", successHandler);
      socketRef.current.once("leave-group-error", errorHandler);

      // Emit the leave group event
      socketRef.current.emit("leave-group", {
        conversationId: conversationId
      });

      console.log("🔥 Emitted leave-group event");
    });
  };

  // Function to edit group info via WebSocket
  const editGroupInfo = (conversationId, groupName, groupAvatar) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error("Socket not connected"));
        return;
      }

      const successHandler = (response) => {
        console.log("🔥 Group info edited successfully:", response);
        socketRef.current.off("group-info-edit-error", errorHandler);

        // Update conversations list with new group info
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                groupName: response.groupName || conv.groupName,
                conversationName: response.groupName || conv.conversationName,
                groupAvatar: response.groupAvatar || conv.groupAvatar,
                conversationAvatar: response.groupAvatar || conv.conversationAvatar
              };
            }
            return conv;
          })
        );

        // Update selected conversation if it's the same one
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(prevConversation => ({
            ...prevConversation,
            groupName: response.groupName || prevConversation.groupName,
            conversationName: response.groupName || prevConversation.conversationName,
            groupAvatar: response.groupAvatar || prevConversation.groupAvatar,
            conversationAvatar: response.groupAvatar || prevConversation.conversationAvatar
          }));
        }

        resolve(response);
      };

      const errorHandler = (error) => {
        console.error("🔥 Error editing group info:", error);
        socketRef.current.off("group-info-edit-success", successHandler);
        reject(new Error(error || "Failed to edit group info"));
      };

      socketRef.current.once("group-info-edit-success", successHandler);
      socketRef.current.once("group-info-edit-error", errorHandler);

      // Emit the edit group info event
      const editData = {
        conversationId: conversationId
      };

      // Only include fields that are provided
      if (groupName && groupName.trim()) {
        editData.groupName = groupName.trim();
      }
      if (groupAvatar && groupAvatar.trim()) {
        editData.groupAvatar = groupAvatar.trim();
      }

      socketRef.current.emit("edit-group-info", editData);

      console.log("🔥 Emitted edit-group-info event:", editData);
    });
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyConversations();
      // setConversations(response?.data?.result || []);

      const sortedConversations = response?.data?.result?.sort((a, b) => {
        const dateA = new Date(a.modifiedDate);
        const dateB = new Date(b.modifiedDate);
        return dateB - dateA; // Most recent first
      });
      console.log("Fetched conversations:", sortedConversations);
      setConversations(sortedConversations);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Load conversations when component mounts
  useEffect(() => {
    fetchConversations();
  }, []);

  // Initialize with first conversation selected when available
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      // Try to restore previously selected conversation from localStorage
      const savedConversationId = localStorage.getItem('selectedConversationId');

      if (savedConversationId) {
        const savedConversation = conversations.find(conv => conv.id === savedConversationId);
        if (savedConversation) {
          setSelectedConversation(savedConversation);
          return;
        }
      }

      // If no saved conversation or saved conversation not found, select first one
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Function to fetch conversation attachments
  const fetchConversationAttachments = useCallback(async (conversationId) => {
    try {
      // Get all messages for the conversation
      const messages = messagesMap[conversationId] || [];

      // Extract media attachments from messages
      const attachments = [];
      messages.forEach(message => {
        // Check for media files in message (from ChatMessageResponse fields)
        if (message.mediaUrl && message.fileName) {
          attachments.push({
            id: message.id,
            messageId: message.id,
            fileName: message.fileName,
            fileUrl: message.mediaUrl,
            fileType: message.mediaType,
            fileSize: message.fileSize,
            uploadedAt: message.createdDate,
            uploadedBy: message.sender?.userId,
            senderName: message.sender?.username,
            senderAvatar: message.sender?.avatar
          });
        }

        // Also check for attachments array if it exists (legacy support)
        if (message.attachments && message.attachments.length > 0) {
          message.attachments.forEach(attachment => {
            attachments.push({
              id: attachment.id || message.id,
              messageId: message.id,
              fileName: attachment.fileName,
              fileUrl: attachment.fileUrl || attachment.url,
              fileType: attachment.fileType || attachment.type,
              fileSize: attachment.fileSize || attachment.size,
              uploadedAt: message.createdDate,
              uploadedBy: message.sender?.userId,
              senderName: message.sender?.username,
              senderAvatar: message.sender?.avatar
            });
          });
        }
      });

      // Remove duplicates based on fileUrl
      const uniqueAttachments = attachments.filter((attachment, index, self) =>
        index === self.findIndex(a => a.fileUrl === attachment.fileUrl)
      );

      // Sort by upload date (newest first)
      uniqueAttachments.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      setConversationAttachments(uniqueAttachments);
      console.log(`Found ${uniqueAttachments.length} media attachments for conversation ${conversationId}:`, uniqueAttachments);
    } catch (error) {
      console.error('Error fetching conversation attachments:', error);
      setConversationAttachments([]);
    }
  }, [messagesMap]);

  // Load messages from the conversation history when a conversation is selected
  useEffect(() => {
    const fetchMessages = async (conversationId) => {
      try {
        // Check if we already have messages for this conversation
        if (!messagesMap[conversationId]) {
          const response = await getMessages(conversationId);
          console.log("Fetched messages for conversation:", response.data.result);
          if (response?.data?.result) {
            // Sort messages by createdDate to ensure chronological order
            const sortedMessages = [...response.data.result].sort(
              (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
            );

            // Store ALL messages (including system messages) for conversation previews
            setMessagesMap((prev) => ({
              ...prev,
              [conversationId]: sortedMessages,
            }));

            // Extract pinned messages (excluding system messages)
            const pinnedMsgs = sortedMessages.filter(msg =>
              (msg.isPinned || msg.pinned) && msg.type !== 'SYSTEM_REACTION' && msg.type !== 'SYSTEM_FILE'
            );
            if (pinnedMsgs.length > 0) {
              setPinnedMessages(prev => ({
                ...prev,
                [conversationId]: pinnedMsgs
              }));
            }
          }
        }

        // Remove the HTTP call to markMessagesAsRead - let socket handle it
        // await markMessagesAsRead(conversationId);

        // Mark conversation as read when selected (update frontend state)
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      } catch (err) {
        console.error(
          `Error fetching messages for conversation ${conversationId}:`,
          err
        );
      }
    };

    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
      // Also fetch attachments for the conversation
      fetchConversationAttachments(selectedConversation.id);
    }
  }, [selectedConversation, messagesMap, fetchConversationAttachments]);

  const currentMessages = selectedConversation
    ? (messagesMap[selectedConversation.id] || [])
      .filter(msg => {
        // Hide system messages that are only for internal processing from chat area
        return msg.type !== 'SYSTEM_REACTION' &&
          msg.type !== 'SYSTEM_FILE';  // Hide raw add-members metadata messages
      })
    : [];

  // Automatically scroll to the bottom when messages change (only for new messages)
  useEffect(() => {
    const currentMessageCount = currentMessages.length;
    const previousMessageCount = lastMessageCountRef.current;

    // Only auto-scroll if:
    // 1. New messages were added (not just re-renders)
    // 2. User is near bottom AND not actively scrolling up
    // 3. Make sure the user isn't intentionally scrolling through history
    const hasNewMessages = currentMessageCount > previousMessageCount;
    const shouldAutoScroll = isNearBottom && !isUserScrolling;

    // Debug logging to understand when auto-scroll triggers
    if (hasNewMessages) {
      console.log('New messages detected:', {
        currentCount: currentMessageCount,
        previousCount: previousMessageCount,
        isNearBottom,
        isUserScrolling,
        shouldAutoScroll
      });
    }

    if (hasNewMessages && shouldAutoScroll) {
      setTimeout(() => scrollToBottom(), 50); // Smaller delay for responsiveness
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [currentMessages.length, scrollToBottom, isNearBottom, isUserScrolling]); // Only depend on message count, not entire array

  // Scroll when the conversation changes (only for genuine conversation switches)
  useEffect(() => {
    if (selectedConversation?.id) {
      // Only force scroll to bottom when genuinely switching conversations
      // Use a ref to track the last conversation ID to avoid unnecessary scrolls
      if (lastConversationIdRef.current !== selectedConversation.id) {
        setTimeout(() => scrollToBottom(true), 100);
        setIsUserScrolling(false);
        setIsNearBottom(true);
        lastConversationIdRef.current = selectedConversation.id;
      }
    }
  }, [selectedConversation?.id, scrollToBottom]);

  // Helper function to handle incoming socket messages
  const handleIncomingMessage = useCallback(
    (message) => {
      // Check if this is a SYSTEM_ADD_MEMBERS message and current user was added
      if (message.type === "SYSTEM_ADD_MEMBERS") {
        // Check if current user is in the conversation list already
        const currentUserId = getCurrentUserId();
        const existingConversation = conversations.find(conv => conv.id === message.conversationId);

        if (!existingConversation) {
          // User was added to a new group they weren't in before - refresh conversation list
          console.log("User was added to a new group, refreshing conversations...");
          fetchConversations();
          // Don't return early - let the message be added to chat area too
        }
      }

      // Check if this is a SYSTEM_REMOVE_MEMBERS message and current user was removed
      if (message.type === "SYSTEM_REMOVE_MEMBERS") {
        // Check if current user's conversation list should be updated
        const currentUserId = getCurrentUserId();

        // Parse message to check if current user was removed
        if (message.message && message.message.includes("You were removed from")) {
          // User was removed from group - refresh conversation list to remove the group
          console.log("User was removed from a group, refreshing conversations...");
          fetchConversations();

          // If this was the selected conversation, clear the selection
          if (selectedConversation && selectedConversation.id === message.conversationId) {
            setSelectedConversation(null);
            setMessagesMap([]);
          }
          // Return early only if user was removed from current conversation
        } else {
          // Other members were removed - refresh to update member counts and let message show in chat
          console.log("Other members were removed, refreshing conversations...");
          fetchConversations();
          // Don't return early - let the message be added to chat area too
        }
      }

      // Check if this is a SYSTEM_LEAVE_GROUP message
      if (message.type === "SYSTEM_LEAVE_GROUP") {
        const currentUserId = getCurrentUserId();

        // Parse message to check if current user left the group
        if (message.message && message.message.includes("You left")) {
          // User left the group - refresh conversation list to remove the group
          console.log("User left the group, refreshing conversations...");
          fetchConversations();

          // If this was the selected conversation, clear the selection
          if (selectedConversation && selectedConversation.id === message.conversationId) {
            setSelectedConversation(null);
            setMessagesMap([]);
          }
          // Return early only if user left current conversation
          return;
        } else {
          // Another member left - immediately update participants list
          console.log("Another member left the group, updating participants immediately...");

          // Extract user name from message text: "Username left GroupName"
          let leavingUserName = null;
          if (message.message) {
            const leftMatch = message.message.match(/^(.+?) left (.+)$/);
            if (leftMatch) {
              leavingUserName = leftMatch[1];
              console.log("🔥 User who left:", leavingUserName);
            }
          }

          if (leavingUserName) {
            // Immediate update function
            const updateParticipants = () => {
              let updated = false;

              // Update conversations list
              setConversations(prevConversations => {
                const newConversations = prevConversations.map(conv => {
                  if (conv.id === message.conversationId && conv.participants) {
                    const updatedParticipants = conv.participants.filter(participant => {
                      const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
                      const shouldRemove = participant.username === leavingUserName || fullName === leavingUserName;
                      return !shouldRemove;
                    });

                    if (updatedParticipants.length !== conv.participants.length) {
                      updated = true;
                      console.log("🔥 Updated conversation participants:", updatedParticipants.length);
                    }
                    return { ...conv, participants: updatedParticipants };
                  }
                  return conv;
                });
                return newConversations;
              });

              // Update selected conversation
              setSelectedConversation(prevConversation => {
                if (prevConversation && prevConversation.id === message.conversationId && prevConversation.participants) {
                  const updatedParticipants = prevConversation.participants.filter(participant => {
                    const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
                    const shouldRemove = participant.username === leavingUserName || fullName === leavingUserName;
                    return !shouldRemove;
                  });

                  if (updatedParticipants.length !== prevConversation.participants.length) {
                    updated = true;
                    console.log("🔥 Updated selectedConversation participants:", updatedParticipants.length);
                  }
                  return { ...prevConversation, participants: updatedParticipants };
                }
                return prevConversation;
              });

              return updated;
            };

            // Try immediate update
            const success = updateParticipants();

            // If no update happened (timing issue), retry after a short delay
            if (!success) {
              console.log("🔥 Initial update failed, retrying in 100ms...");
              setTimeout(() => {
                updateParticipants();
              }, 100);
            }
          }

          // Refresh from server for consistency
          fetchConversations();
        }
      }

      // Add the new message to the appropriate conversation
      setMessagesMap((prev) => {
        const existingMessages = prev[message.conversationId] || [];

        // Check if message already exists to avoid duplicates
        const messageExists = existingMessages.some((msg) => {
          // Primary: Compare by ID if both messages have IDs
          if (msg.id && message.id) {
            return msg.id === message.id;
          }

          return false;
        });

        if (!messageExists) {
          const updatedMessages = [...existingMessages, message].sort(
            (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
          );

          return {
            ...prev,
            [message.conversationId]: updatedMessages,
          };
        }

        console.log("Message already exists, not adding");
        return prev;
      });

      // Update the conversation list with the new last message
      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) =>
          conv.id === message.conversationId
            ? {
              ...conv,
              lastMessage: message,
              lastTimestamp: new Date(message.createdDate).toLocaleString(),
              unreadCount: (() => {
                // For system messages (add/remove/leave members), handle differently
                const isSystemMessage = message.type === 'SYSTEM' ||
                  message.type === 'SYSTEM_ADD_MEMBERS' ||
                  message.type === 'SYSTEM_REMOVE_MEMBERS' ||
                  message.type === 'SYSTEM_LEAVE_GROUP';

                if (isSystemMessage) {
                  // If current user was removed or left, don't increment unread count
                  if (message.message && (
                    message.message.includes("You were removed from") ||
                    message.message.includes("You left")
                  )) {
                    return 0;
                  }

                  // If user performed the action, don't increment for them
                  if (message.me) {
                    return conv.unreadCount || 0;
                  }

                  // Special handling for group creation and add members sequence
                  if (message.type === 'SYSTEM_ADD_MEMBERS') {
                    // Check if this is related to initial group creation
                    const currentUserId = getCurrentUserId();

                    // If conversation was just created (no existing unread count or count is 0/1)
                    // and this is an add members message, this might be the initial member addition
                    if ((conv.unreadCount || 0) <= 1) {
                      // Check if user was just added to this group (new participant)
                      const wasJustAdded = message.message &&
                        (message.message.includes("You were added") ||
                          message.message.includes("added to"));

                      if (wasJustAdded) {
                        console.log("🔥 User was added to new group, setting unread count to 1");
                        return 1; // Set to 1 for newly added users
                      } else {
                        // This is someone else being added to a group the user is already in
                        // Check if we already have an unread count
                        if (conv.unreadCount && conv.unreadCount > 0) {
                          console.log("🔥 Avoiding double count - keeping existing unread count");
                          return conv.unreadCount; // Don't increment
                        } else {
                          console.log("🔥 First system message for existing member");
                          return 1; // First system message
                        }
                      }
                    }
                  }

                  // For other system messages, increment normally
                  console.log("🔥 System message unread count logic:", {
                    messageType: message.type,
                    messageText: message.message,
                    currentUnreadCount: conv.unreadCount || 0,
                    newUnreadCount: (conv.unreadCount || 0) + 1
                  });
                  return (conv.unreadCount || 0) + 1;
                }

                // For regular messages, use original logic
                // Don't increment unread count if:
                // 1. This conversation is currently selected, OR
                // 2. The current user is the sender of this message
                return selectedConversation?.id === message.conversationId || message.me
                  ? conv.unreadCount || 0  // Keep current unread count
                  : (conv.unreadCount || 0) + 1;  // Increment for recipients only
              })(),
              modifiedDate: message.createdDate,
            }
            : conv
        );

        // Sort conversations by modifiedDate (most recent first)
        const sortedConversations = updatedConversations.sort((a, b) => {
          const dateA = new Date(a.modifiedDate);
          const dateB = new Date(b.modifiedDate);
          return dateB - dateA; // Most recent first
        });

        console.log("Updated and sorted conversations:", sortedConversations);
        return sortedConversations;
      });
    },
    [selectedConversation, conversations, fetchConversations]
  );

  useEffect(() => {
    // Initialize socket connection only once
    if (!socketRef.current) {
      console.log("Initializing socket connection...");

      const connectionUrl = "http://localhost:8099?token=" + getToken();

      socketRef.current = new io(connectionUrl);

      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected successfully");
        console.log("Socket ID:", socketRef.current.id);

        // Store user ID from token for later comparison
        try {
          const token = getToken();
          if (token) {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            socketRef.current.userId = tokenPayload.sub || tokenPayload.userId;
            console.log("🔥 Stored user ID on socket:", socketRef.current.userId);
          }
        } catch (error) {
          console.error("🔥 Error extracting user ID from token:", error);
        }
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
      });

      // Add listener for any event to debug
      socketRef.current.onAny((eventName, ...args) => {
        console.log("Socket event received:", eventName, args);
      });

      // Debug outbound emissions
      const originalEmit = socketRef.current.emit;
      socketRef.current.emit = function (eventName, ...args) {
        console.log("🔥 Socket emitting:", eventName, args);
        return originalEmit.call(this, eventName, ...args);
      };

      socketRef.current.on("message", (message) => {
        console.log("New message received:", message);

        const messageObject = JSON.parse(message);
        console.log("Parsed message object:", messageObject);

        // Update messages in the UI when a new message is received
        if (messageObject?.conversationId) {
          handleIncomingMessage(messageObject);
        }
      });

      // Listen for reply messages
      socketRef.current.on("reply-message", (replyMessage) => {
        console.log("New reply message received:", replyMessage);

        const messageObject = JSON.parse(replyMessage);
        console.log("Parsed reply message object:", messageObject);

        // Update messages in the UI when a reply message is received
        if (messageObject?.conversationId) {
          handleIncomingMessage(messageObject);
        }
      });

      // Listen for message status updates (when messages are marked as seen)
      socketRef.current.on("message-status-update", (statusUpdate) => {
        console.log("🔥 Message status update received:", statusUpdate);

        try {
          const statusObject = JSON.parse(statusUpdate);
          console.log("🔥 Parsed status update:", statusObject);

          // Update message status in the UI
          if (statusObject?.conversationId && statusObject?.messageIds) {
            const { conversationId, messageIds, status, readDate } = statusObject;

            console.log("Updating message status:", { conversationId, messageIds, status, readDate });

            // Update messages in the current conversation
            setMessagesMap((prev) => {
              const existingMessages = prev[conversationId] || [];

              const updatedMessages = existingMessages.map((msg) => {
                // Update status for messages in the messageIds array
                if (messageIds.includes(msg.id)) {
                  return {
                    ...msg,
                    status: status,
                    readDate: readDate || msg.readDate
                  };
                }
                return msg;
              });

              return {
                ...prev,
                [conversationId]: updatedMessages,
              };
            });

            // Update conversation's last message status if it's affected
            setConversations((prevConversations) => {
              return prevConversations.map((conv) => {
                if (conv.id === conversationId && conv.lastMessage && messageIds.includes(conv.lastMessage.id)) {
                  return {
                    ...conv,
                    lastMessage: {
                      ...conv.lastMessage,
                      status: status,
                      readDate: readDate || conv.lastMessage.readDate
                    }
                  };
                }
                return conv;
              });
            });
          }
        } catch (error) {
          console.error("Error parsing message status update:", error);
        }
      });

      // Listen for reaction updates
      socketRef.current.on("reaction-update", (reactionUpdate) => {
        console.log("Reaction update received:", reactionUpdate);

        try {
          const reactionObject = JSON.parse(reactionUpdate);
          console.log("Parsed reaction update:", reactionObject);

          // Update message reactions in the UI
          if (reactionObject?.messageId && reactionObject?.conversationId) {
            const { messageId, conversationId, reactions } = reactionObject;

            // Update the specific message with new reactions
            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: prev[conversationId].map(msg =>
                msg.id === messageId
                  ? { ...msg, reactions: reactions || [] }
                  : msg
              )
            }));

            if (reactionDetailsOpen && selectedMessageForReactionDetails?.id === messageId) {
              const reactionGroups = {};

              (reactions || []).forEach(reaction => {
                if (!reactionGroups[reaction.icon]) {
                  reactionGroups[reaction.icon] = {
                    icon: reaction.icon,
                    count: 0,
                    reactedBy: [],
                    users: []
                  };
                }
                reactionGroups[reaction.icon].count += reaction.count;
                if (reaction.reactedByMe) {
                  reactionGroups[reaction.icon].reactedByMe = true;
                }

                if (reaction.users && reaction.users.length > 0) {
                  reactionGroups[reaction.icon].users.push(...reaction.users);
                }
              });
              setReactionDetailsData(Object.values(reactionGroups));
            }
          }
        } catch (error) {
          console.error("Error parsing reaction update:", error);
        }
      });

      // Listen for recall message success
      socketRef.current.on("recall-message-success", (recallResponse) => {
        console.log("Message recall success received:", recallResponse);

        try {
          const responseObject = typeof recallResponse === 'string'
            ? JSON.parse(recallResponse)
            : recallResponse;
          console.log("Parsed recall success response:", responseObject);

          // Update message in the UI with successful recall
          if (responseObject?.id && responseObject?.conversationId) {
            const { id: messageId, conversationId, message: recallMessage, recalled, recallType } = responseObject;

            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: prev[conversationId].map(msg =>
                msg.id === messageId
                  ? {
                    ...msg,
                    recalled: recalled,
                    recallType: recallType,
                    message: recallMessage,
                    pending: false,
                    reactions: recalled ? [] : msg.reactions // Clear reactions if recalled
                  }
                  : msg
              )
            }));

            // Update conversation's last message if it was recalled
            setConversations(prevConversations =>
              prevConversations.map(conv =>
                conv.id === conversationId && conv.lastMessage?.id === messageId
                  ? {
                    ...conv,
                    lastMessage: {
                      ...conv.lastMessage,
                      message: recallMessage,
                      recalled: recalled,
                      recallType: recallType
                    }
                  }
                  : conv
              )
            );

            // Show success notification
            if (recalled) {
              setNotification({
                open: true,
                message: `Message recalled successfully ${recallType === 'self' ? 'for you' : 'for everyone'}`,
                severity: 'success'
              });
            }
          }
        } catch (error) {
          console.error("Error parsing recall success response:", error);
        }
      });

      // Listen for recall message errors
      socketRef.current.on("recall-message-error", (errorMessage) => {
        console.error("Message recall error received:", errorMessage);

        // Show error notification
        setNotification({
          open: true,
          message: `Failed to recall message: ${errorMessage}`,
          severity: 'error'
        });

        // Revert optimistic update for any pending recalled messages
        setMessagesMap(prev => {
          const updatedMap = { ...prev };
          Object.keys(updatedMap).forEach(conversationId => {
            updatedMap[conversationId] = updatedMap[conversationId].map(msg =>
              msg.pending && (msg.recalled || msg.isRecalled)
                ? { ...msg, pending: false, recalled: false, isRecalled: false, message: msg.originalMessage || msg.message }
                : msg
            );
          });
          return updatedMap;
        });
      });

      // Listen for message recalled broadcasts (from backend broadcast)
      socketRef.current.on("message-recalled", (recallUpdate) => {
        console.log("Message recalled broadcast received:", recallUpdate);

        try {
          const recallObject = typeof recallUpdate === 'string'
            ? JSON.parse(recallUpdate)
            : recallUpdate;
          console.log("Parsed recall broadcast:", recallObject);

          // Update message in the UI with recall information
          if (recallObject?.id && recallObject?.conversationId) {
            const { id: messageId, conversationId, message: recallMessage, recalled, recallType } = recallObject;

            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: prev[conversationId].map(msg =>
                msg.id === messageId
                  ? {
                    ...msg,
                    recalled: recalled,
                    recallType: recallType,
                    message: recallMessage,
                    pending: false,
                    reactions: recalled ? [] : msg.reactions // Clear reactions if recalled
                  }
                  : msg
              )
            }));

            // Update conversation's last message if it was recalled
            setConversations(prevConversations =>
              prevConversations.map(conv =>
                conv.id === conversationId && conv.lastMessage?.id === messageId
                  ? {
                    ...conv,
                    lastMessage: {
                      ...conv.lastMessage,
                      message: recallMessage,
                      recalled: recalled,
                      recallType: recallType
                    }
                  }
                  : conv
              )
            );
          }
        } catch (error) {
          console.error("Error parsing message recalled broadcast:", error);
        }
      });

      // Listen for pin message success (separate events for pin/unpin)
      socketRef.current.on("pin-message-success", (pinResponse) => {
        console.log("Message pin success received:", pinResponse);

        try {
          const responseObject = typeof pinResponse === 'string'
            ? JSON.parse(pinResponse)
            : pinResponse;
          console.log("Parsed pin success response:", responseObject);

          // Update message in the UI with successful pin
          if (responseObject?.id && responseObject?.conversationId) {
            const { id: messageId, conversationId, isPinned, pinned } = responseObject;

            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: prev[conversationId].map(msg =>
                msg.id === messageId
                  ? {
                    ...msg,
                    isPinned: isPinned || pinned || true,
                    pinned: isPinned || pinned || true,
                    pending: false
                  }
                  : msg
              )
            }));

            // Update pinned messages state
            setPinnedMessages(prev => {
              const conversationPinned = prev[conversationId] || [];
              const message = responseObject;
              return {
                ...prev,
                [conversationId]: [...conversationPinned.filter(msg => msg.id !== messageId), message]
              };
            });

            // Show success notification
            setNotification({
              open: true,
              message: 'Message pinned successfully',
              severity: 'success'
            });
          }
        } catch (error) {
          console.error("Error parsing pin success response:", error);
        }
      });

      socketRef.current.on("unpin-message-success", (unpinResponse) => {
        console.log("Message unpin success received:", unpinResponse);

        try {
          const responseObject = typeof unpinResponse === 'string'
            ? JSON.parse(unpinResponse)
            : unpinResponse;
          console.log("Parsed unpin success response:", responseObject);

          // Update message in the UI with successful unpin
          if (responseObject?.id && responseObject?.conversationId) {
            const { id: messageId, conversationId } = responseObject;

            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: prev[conversationId].map(msg =>
                msg.id === messageId
                  ? {
                    ...msg,
                    isPinned: false,
                    pinned: false,
                    pending: false
                  }
                  : msg
              )
            }));

            // Update pinned messages state
            setPinnedMessages(prev => {
              const conversationPinned = prev[conversationId] || [];
              return {
                ...prev,
                [conversationId]: conversationPinned.filter(msg => msg.id !== messageId)
              };
            });

            // Show success notification
            setNotification({
              open: true,
              message: 'Message unpinned successfully',
              severity: 'success'
            });
          }
        } catch (error) {
          console.error("Error parsing unpin success response:", error);
        }
      });

      // Listen for pin message errors
      socketRef.current.on("pin-message-error", (errorMessage) => {
        console.error("Message pin/unpin error received:", errorMessage);

        // Show error notification
        setNotification({
          open: true,
          message: `Failed to pin/unpin message: ${errorMessage}`,
          severity: 'error'
        });

        // Revert optimistic update
        setMessagesMap(prev => {
          const updatedMap = { ...prev };
          Object.keys(updatedMap).forEach(conversationId => {
            updatedMap[conversationId] = updatedMap[conversationId].map(msg =>
              msg.pending ? { ...msg, pending: false } : msg
            );
          });
          return updatedMap;
        });
      });

      // Listen for pin message broadcasts (from backend broadcast)
      socketRef.current.on("message-pinned", (pinUpdate) => {
        console.log("Message pinned broadcast received:", pinUpdate);

        try {
          const pinObject = typeof pinUpdate === 'string'
            ? JSON.parse(pinUpdate)
            : pinUpdate;
          console.log("Parsed pin broadcast:", pinObject);

          // Update message in the UI with pin information
          if (pinObject?.id && pinObject?.conversationId) {
            const { id: messageId, conversationId, isPinned, pinned } = pinObject;

            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: prev[conversationId].map(msg =>
                msg.id === messageId
                  ? {
                    ...msg,
                    isPinned: isPinned || pinned || true,
                    pinned: isPinned || pinned || true
                  }
                  : msg
              )
            }));

            // Update pinned messages state
            setPinnedMessages(prev => {
              const conversationPinned = prev[conversationId] || [];
              const message = pinObject;
              return {
                ...prev,
                [conversationId]: [...conversationPinned.filter(msg => msg.id !== messageId), message]
              };
            });
          }
        } catch (error) {
          console.error("Error parsing message pinned broadcast:", error);
        }
      });

      socketRef.current.on("message-unpinned", (unpinUpdate) => {
        console.log("Message unpinned broadcast received:", unpinUpdate);

        try {
          const unpinObject = typeof unpinUpdate === 'string'
            ? JSON.parse(unpinUpdate)
            : unpinUpdate;
          console.log("Parsed unpin broadcast:", unpinObject);

          // Update message in the UI with unpin information
          if (unpinObject?.id && unpinObject?.conversationId) {
            const { id: messageId, conversationId } = unpinObject;

            setMessagesMap(prev => ({
              ...prev,
              [conversationId]: prev[conversationId].map(msg =>
                msg.id === messageId
                  ? {
                    ...msg,
                    isPinned: false,
                    pinned: false
                  }
                  : msg
              )
            }));

            // Update pinned messages state
            setPinnedMessages(prev => {
              const conversationPinned = prev[conversationId] || [];
              return {
                ...prev,
                [conversationId]: conversationPinned.filter(msg => msg.id !== messageId)
              };
            });
          }
        } catch (error) {
          console.error("Error parsing message unpinned broadcast:", error);
        }
      });

      // Listen for media message events
      socketRef.current.on("media-message-success", (response) => {
        console.log("📁 Media message sent successfully:", response);
        setIsUploadingFile(false);
        setSelectedFile(null);
        setFilePreview(null);
        setMessage(""); // Clear message input

        // Show success notification
        setNotification({
          open: true,
          message: 'Media message sent successfully',
          severity: 'success'
        });
      });

      socketRef.current.on("media-message-error", (error) => {
        console.error("📁 Error sending media message:", error);
        setIsUploadingFile(false);

        // Show error notification
        setNotification({
          open: true,
          message: `Failed to send media message: ${error}`,
          severity: 'error'
        });
      });

      socketRef.current.on("media-reply-success", (response) => {
        console.log("📁 Media reply sent successfully:", response);
        setIsUploadingFile(false);
        setSelectedFile(null);
        setFilePreview(null);
        setMessage(""); // Clear message input
        setReplyingTo(null);

        // Show success notification
        setNotification({
          open: true,
          message: 'Media reply sent successfully',
          severity: 'success'
        });
      });

      socketRef.current.on("media-reply-error", (error) => {
        console.error("📁 Error sending media reply:", error);
        setIsUploadingFile(false);

        // Show error notification
        setNotification({
          open: true,
          message: `Failed to send media reply: ${error}`,
          severity: 'error'
        });
      });

      socketRef.current.on("message-deleted", (deletionData) => {
        console.log("📁 Message deletion received:", deletionData);

        try {
          const deletionInfo = JSON.parse(deletionData);

          // Remove the deleted message from the UI
          setMessagesMap((prev) => {
            const conversationMessages = prev[deletionInfo.conversationId] || [];
            const updatedMessages = conversationMessages.filter(
              msg => msg.id !== deletionInfo.messageId
            );

            return {
              ...prev,
              [deletionInfo.conversationId]: updatedMessages,
            };
          });

          // Update conversation list if needed
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === deletionInfo.conversationId &&
                conv.lastMessage?.id === deletionInfo.messageId) {
                // Find new last message
                const messages = messagesMap[deletionInfo.conversationId] || [];
                const remainingMessages = messages.filter(msg => msg.id !== deletionInfo.messageId);
                const newLastMessage = remainingMessages[remainingMessages.length - 1] || null;

                return {
                  ...conv,
                  lastMessage: newLastMessage,
                };
              }
              return conv;
            })
          );

        } catch (error) {
          console.error("📁 Error parsing deletion data:", error);
        }
      });

      // Group conversation creation / reception handler (deduplicated)
      socketRef.current.on("new-group-conversation", (incoming) => {
        console.log("🔥 raw new-group-conversation event:", incoming);
        try {
          const raw = typeof incoming === 'string' ? JSON.parse(incoming) : incoming;

          // Normalize structure expected by UI
          const normalized = {
            id: raw.id,
            type: raw.type || 'GROUP',
            participantsHash: raw.participantsHash,
            participants: raw.participants || [],
            groupName: raw.groupName,
            conversationName: raw.groupName || raw.conversationName || 'Unnamed group',
            conversationAvatar: raw.groupAvatar || raw.conversationAvatar || null,
            groupAvatar: raw.groupAvatar || raw.conversationAvatar || null,
            createdBy: raw.createdBy,
            lastMessage: raw.lastMessage || null,
            modifiedDate: raw.modifiedDate || raw.createdDate || new Date().toISOString(),
            createdDate: raw.createdDate || new Date().toISOString(),
            // IMPORTANT: unreadCount logic
            // Creator should start with 0 (they created it)
            // Recipients should start with 1 (system welcome message counts as unread)
            unreadCount: raw.createdBy === socketRef.current.userId ? 0 : 1,
          };

          console.log("🔥 Setting initial unread count for new group:", {
            conversationId: raw.id,
            userId: socketRef.current.userId,
            createdBy: raw.createdBy,
            isCreator: raw.createdBy === socketRef.current.userId,
            unreadCount: raw.createdBy === socketRef.current.userId ? 0 : 1
          });

          // If backend sends unreadCount explicitly, prefer it
          if (typeof raw.unreadCount === 'number') {
            normalized.unreadCount = raw.unreadCount;
          }

          setConversations(prev => {
            if (prev.some(c => c.id === normalized.id)) return prev;
            return [normalized, ...prev].sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate));
          });

          // Notify
          if (normalized.createdBy === socketRef.current.userId) {
            setNotification({
              open: true,
              message: `Group "${normalized.conversationName}" created successfully`,
              severity: 'success'
            });
            // Auto select for creator
            setSelectedConversation(normalized);
          } else {
            setNotification({
              open: true,
              message: `You've been added to group "${normalized.conversationName}"`,
              severity: 'info'
            });
          }
        } catch (e) {
          console.error('🔥 Failed handling new-group-conversation:', e);
        }
      });

      socketRef.current.on("create-group-success", (response) => {
        console.log("🔥 Group creation success confirmation:", response);
        // This is just a confirmation, the actual conversation data comes via new-group-conversation
      });

      socketRef.current.on("create-group-error", (error) => {
        console.error("🔥 Error creating group conversation:", error);

        // Show error notification
        setNotification({
          open: true,
          message: `Failed to create group: ${error}`,
          severity: 'error'
        });
      });

      // Listen for group info update broadcasts
      socketRef.current.on("group-info-updated", (updatedConversation) => {
        console.log("🔥 Group info updated broadcast received:", updatedConversation);

        try {
          const conversationData = typeof updatedConversation === 'string'
            ? JSON.parse(updatedConversation)
            : updatedConversation;

          console.log("🔥 Parsed group info update:", conversationData);

          // Update conversations list with new group info
          setConversations(prevConversations =>
            prevConversations.map(conv => {
              if (conv.id === conversationData.id) {
                console.log("🔥 Updating conversation with new group info:", {
                  oldName: conv.groupName,
                  newName: conversationData.groupName,
                  oldAvatar: conv.groupAvatar,
                  newAvatar: conversationData.groupAvatar
                });
                return {
                  ...conv,
                  groupName: conversationData.groupName || conv.groupName,
                  conversationName: conversationData.groupName || conv.conversationName,
                  groupAvatar: conversationData.groupAvatar || conv.groupAvatar,
                  conversationAvatar: conversationData.groupAvatar || conv.conversationAvatar
                };
              }
              return conv;
            })
          );

          // Update selected conversation if it's the same one
          if (selectedConversation && selectedConversation.id === conversationData.id) {
            console.log("🔥 Updating selected conversation with new group info");
            setSelectedConversation(prevConversation => ({
              ...prevConversation,
              groupName: conversationData.groupName || prevConversation.groupName,
              conversationName: conversationData.groupName || prevConversation.conversationName,
              groupAvatar: conversationData.groupAvatar || prevConversation.groupAvatar,
              conversationAvatar: conversationData.groupAvatar || prevConversation.conversationAvatar
            }));
          }

          // Show success notification
          setNotification({
            open: true,
            message: 'Group info updated successfully',
            severity: 'success'
          });

        } catch (error) {
          console.error("Error parsing group info update:", error);
        }
      });

      socketRef.current.on("edit-message-success", (editedMessage) => {
        const msg = typeof editedMessage === 'string' ? JSON.parse(editedMessage) : editedMessage;
        setMessagesMap(prev => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] || []).map(m =>
            m.id === msg.id ? {...m, ...msg} : m
          )
        }));
        setNotification({
          open: true,
          message: 'Message edited successfully',
          severity: 'success'
        });
        setEditingMessage(null);
        setMessage('');
      })

      socketRef.current.on("edit-message-error", (error) => {
        console.error("Error editing message:", error);
        setNotification({
          open: true,
          message: `Failed to edit message: ${error}`,
          severity: 'error'
        });
      });

      // (Removed duplicate new-group-conversation handler)
    }

    
    // Cleanup function - disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket...");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Remove callback dependencies to prevent socket recreation

  useEffect(() => {
    if (socketRef.current && selectedConversation?.id) {
      // Join the conversation room when a conversation is selected
      socketRef.current.emit("leave-conversation");
      socketRef.current.emit("join-conversation", selectedConversation.id);
      console.log(
        `Joined room for conversation ${selectedConversation.id}`
      );

      // Emit message-status-update to mark messages as seen
      socketRef.current.emit("message-status-update", selectedConversation.id);
      console.log(
        `Emitted message-status-update for conversation ${selectedConversation.id}`
      );
    }
  }, [selectedConversation?.id])

  // Update unread count when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && socketRef.current) {
      // Mark the currently selected conversation as read
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === selectedConversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }
  }, [selectedConversation]);

  // Enhanced rendering function for last message in conversation list
  const renderLastMessage = (conversation) => {
    if (!conversation.lastMessage) return "No messages yet";

    const lastMsg = conversation.lastMessage;

    // Handle different message types for display in conversation list
    switch (lastMsg.type) {
      case 'SYSTEM':
        // Check if this is an add-members message and personalize it
        if (lastMsg.message && lastMsg.message.includes(' added ') && lastMsg.message.includes(' to ')) {
          return personalizeAddMembersMessage(lastMsg.message, conversation);
        }
        // Check if this is a remove-members message and personalize it
        if (lastMsg.message && lastMsg.message.includes(' removed ') && lastMsg.message.includes(' from ')) {
          return personalizeRemoveMembersMessage(lastMsg.message, conversation);
        }
        // Check if this is a leave-group message and personalize it
        if (lastMsg.message && lastMsg.message.includes(' left ')) {
          return personalizeLeaveGroupMessage(lastMsg.message, conversation);
        }
        return lastMsg.message || "System message";
      case 'SYSTEM_ADD_MEMBERS':
        // This should be handled by metadata parsing if it contains JSON
        if (lastMsg.message && lastMsg.message.startsWith('SYSTEM_ADD_MEMBERS:')) {
          try {
            const metadataJson = lastMsg.message.substring('SYSTEM_ADD_MEMBERS:'.length());
            const metadata = JSON.parse(metadataJson);

            const currentUserId = getCurrentUserId();
            const adderId = metadata.adderId;
            const adderName = metadata.adderName;
            const addedMemberIds = metadata.addedMemberIds || [];
            const addedMembersNames = metadata.addedMembersNames;
            const groupName = metadata.groupName;

            // Generate personalized message based on current user's role
            if (currentUserId === adderId) {
              return `You added ${addedMembersNames} to ${groupName}`;
            } else if (addedMemberIds.includes(currentUserId)) {
              return `You were added to ${groupName} by ${adderName}`;
            } else {
              return `${adderName} added ${addedMembersNames} to ${groupName}`;
            }
          } catch (e) {
            console.error('Error parsing add-members metadata:', e);
            return lastMsg.message || "Members added to group";
          }
        }
        return lastMsg.message || "Members added to group";
      case 'SYSTEM_REMOVE_MEMBERS':
        // This should be handled by metadata parsing if it contains JSON
        if (lastMsg.message && lastMsg.message.startsWith('SYSTEM_REMOVE_MEMBERS:')) {
          try {
            const metadataJson = lastMsg.message.substring('SYSTEM_REMOVE_MEMBERS:'.length());
            const metadata = JSON.parse(metadataJson);

            const currentUserId = getCurrentUserId();
            const removerId = metadata.removerId;
            const removerName = metadata.removerName;
            const removedMemberIds = metadata.removedMemberIds || [];
            const removedMembersNames = metadata.removedMembersNames;
            const groupName = metadata.groupName;

            // Generate personalized message based on current user's role
            if (currentUserId === removerId) {
              return `You removed ${removedMembersNames} from ${groupName}`;
            } else if (removedMemberIds.includes(currentUserId)) {
              return `You were removed from ${groupName} by ${removerName}`;
            } else {
              return `${removerName} removed ${removedMembersNames} from ${groupName}`;
            }
          } catch (e) {
            console.error('Error parsing remove-members metadata:', e);
            return lastMsg.message || "Members removed from group";
          }
        }
        return lastMsg.message || "Members removed from group";
      case 'SYSTEM_LEAVE_GROUP':
        // This should be handled by metadata parsing if it contains JSON
        if (lastMsg.message && lastMsg.message.startsWith('SYSTEM_LEAVE_GROUP:')) {
          try {
            const metadataJson = lastMsg.message.substring('SYSTEM_LEAVE_GROUP:'.length());
            const metadata = JSON.parse(metadataJson);

            const currentUserId = getCurrentUserId();
            const leavingUserId = metadata.leavingUserId;
            const leavingUserName = metadata.leavingUserName;
            const groupName = metadata.groupName;

            // Generate personalized message based on current user's role
            if (currentUserId === leavingUserId) {
              return `You left ${groupName}`;
            } else {
              return `${leavingUserName} left ${groupName}`;
            }
          } catch (e) {
            console.error('Error parsing leave-group metadata:', e);
            return lastMsg.message || "A member left the group";
          }
        }
        // Check if this is a generic leave message and personalize it
        if (lastMsg.message && lastMsg.message.includes(' left ')) {
          return personalizeLeaveGroupMessage(lastMsg.message, conversation);
        }
        return lastMsg.message || "A member left the group";
      case 'SYSTEM_EDIT_GROUP_NAME':
        return lastMsg.message || "Group name changed";
      case 'SYSTEM_FILE':
        return lastMsg.message || "File message";
      case 'SYSTEM_REACTION':
        return lastMsg.message; // Show reaction system messages
      case 'TEXT':
        if (lastMsg.isRecalled || lastMsg.recalled) {
          return "Message has been recalled";
        }
        return lastMsg.message;
      case 'REPLY':
        return `Reply: ${lastMsg.message}`;
      default:
        return lastMsg.message;
    }
  };

  // Helper function to personalize add-members messages
  const personalizeAddMembersMessage = (message, conversation) => {
    const currentUserId = getCurrentUserId();

    // Parse message format: "AdderName added MemberNames to GroupName"
    const addedMatch = message.match(/^(.+?) added (.+?) to (.+)$/);
    if (!addedMatch) return message;

    const [, adderName, addedMembersNames, groupName] = addedMatch;

    // Check if current user was the adder by looking at conversation participants
    const currentUserParticipant = conversation.participants?.find(p => p.userId === currentUserId);
    const currentUserName = currentUserParticipant ?
      `${currentUserParticipant.firstName} ${currentUserParticipant.lastName}` : '';

    // Check if current user is the adder
    if (adderName === currentUserName) {
      return `You added ${addedMembersNames} to ${groupName}`;
    }

    // Check if current user is among the added members
    // This is harder to determine from the generic message, so we'll check if user is new
    const addedNames = addedMembersNames.split(', ');
    if (addedNames.includes(currentUserName)) {
      return `You were added to ${groupName} by ${adderName}`;
    }

    // Default: show generic message for other members
    return message;
  };

  // Helper function to personalize remove-members messages
  const personalizeRemoveMembersMessage = (message, conversation) => {
    const currentUserId = getCurrentUserId();

    // Parse message format: "RemoverName removed MemberNames from GroupName"
    const removedMatch = message.match(/^(.+?) removed (.+?) from (.+)$/);
    if (!removedMatch) return message;

    const [, removerName, removedMembersNames, groupName] = removedMatch;

    // Check if current user was the remover by looking at conversation participants
    const currentUserParticipant = conversation.participants?.find(p => p.userId === currentUserId);
    const currentUserName = currentUserParticipant ?
      `${currentUserParticipant.firstName} ${currentUserParticipant.lastName}` : '';

    // Check if current user is the remover
    if (removerName === currentUserName) {
      return `You removed ${removedMembersNames} from ${groupName}`;
    }

    // Check if current user is among the removed members
    const removedNames = removedMembersNames.split(', ');
    if (removedNames.includes(currentUserName)) {
      return `You were removed from ${groupName} by ${removerName}`;
    }

    // Default: show generic message for other members
    return message;
  };

  // Helper function to personalize leave-group messages
  const personalizeLeaveGroupMessage = (message, conversation) => {
    const currentUserId = getCurrentUserId();

    // Parse message format: "LeavingUserName left GroupName"
    const leftMatch = message.match(/^(.+?) left (.+)$/);
    if (!leftMatch) return message;

    const [, leavingUserName, groupName] = leftMatch;

    // Check if current user was the one who left by looking at conversation participants
    const currentUserParticipant = conversation.participants?.find(p => p.userId === currentUserId);
    const currentUserName = currentUserParticipant ?
      `${currentUserParticipant.firstName} ${currentUserParticipant.lastName}` : '';

    // Check if current user is the one who left
    if (leavingUserName === currentUserName) {
      return `You left ${groupName}`;
    }

    // Default: show generic message for other members
    return message;
  };

  const handleConversationSelect = async (conversation) => {
    if (selectedConversation?.id === conversation.id) {
      return;
    }

    console.log("Selected conversation:", conversation);
    setSelectedConversation(conversation);

    localStorage.setItem('selectedConversationId', conversation.id);

    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === conversation.id
          ? { ...conv, unreadCount: 0 } // Mark as read
          : conv
      )
    );
  };

  // Forward message dialog state
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState(null);

  // Listen for forward-message-success/error
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    const handleSuccess = (msg) => {
      setNotification({ open: true, message: 'Message forwarded!', severity: 'success' });
    };
    const handleError = (err) => {
      setNotification({ open: true, message: err || 'Failed to forward message', severity: 'error' });
    };
    socket.on('forward-message-success', handleSuccess);
    socket.on('forward-message-error', handleError);
    return () => {
      socket.off('forward-message-success', handleSuccess);
      socket.off('forward-message-error', handleError);
    };
  }, []);

  const handleForwardClick = (messageId) => {
    setForwardMessageId(messageId);
    setForwardDialogOpen(true);
  };

  const handleForward = (conversationId) => {
    if (!forwardMessageId) return;
    const fromUserId = getCurrentUserId();

    forwardMessage({
      fromUserId,
      toConversationId: conversationId,
      messageId: forwardMessageId,
      socket: socketRef.current
    });

    setForwardDialogOpen(false);
    setForwardMessageId(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    const messageText = message;
    // Clear input field
    setMessage("");

    if (editingMessage){
      editMessage({
        conversationId: selectedConversation.id,
        messageId: editingMessage.id,
        newMessage: messageText,
        socket: socketRef.current
      })
    }else{
      try {
        if (replyingTo) {
          // Send reply message via socket
          socketRef.current.emit("reply-message", {
            conversationId: selectedConversation.id,
            message: messageText,
            replyToMessageId: replyingTo.id,
          });
          // Clear reply state
          setReplyingTo(null);
        } else {
          // Send regular message to API
          await createMessage({
            conversationId: selectedConversation.id,
            message: messageText,
          });
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }

  };

  // Message action handlers
  const handleReply = (messageToReply) => {
    console.log("Reply to message:", messageToReply);
    setReplyingTo(messageToReply);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleMoreActionsClick = (event, message) => {
    setMoreActionsAnchorEl(event.currentTarget); // Set the clicked button as the anchor
    setSelectedMessageForActions(message);
  };

  const handleMoreActionsClose = () => {
    setMoreActionsAnchorEl(null);
    setSelectedMessageForActions(null);
  };

  const handleEditMessage = (editingMessage) => {
    console.log("Edit message:", editingMessage);
    if (!editingMessage) return;

    // Send edit message request via socket
   if (selectedMessageForActions){
    setEditingMessage(selectedMessageForActions);
    setMessage(selectedMessageForActions.message);
   }
    handleMoreActionsClose();
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
  }

  const handleRecallMessage = (recallType) => {
    console.log("Recall message:", selectedMessageForActions, "with type:", recallType);

    if (selectedMessageForActions && socketRef.current) {
      // Check socket connection status
      console.log("Socket connected:", socketRef.current.connected);
      console.log("Socket ID:", socketRef.current.id);

      // Send recall message request via socket with recall type
      const recallPayload = {
        messageId: selectedMessageForActions.id,
        conversationId: selectedConversation.id,
        recallType: recallType // "self" or "everyone"
      };

      console.log("Emitting recall-message with payload:", recallPayload);

      socketRef.current.emit("recall-message", recallPayload);

      console.log("Sent recall request for message:", selectedMessageForActions.id, "with type:", recallType);

      // Immediately update the UI to show the message as recalled (optimistic update)
      setMessagesMap(prevMessagesMap => ({
        ...prevMessagesMap,
        [selectedConversation.id]: prevMessagesMap[selectedConversation.id].map(msg =>
          msg.id === selectedMessageForActions.id
            ? {
              ...msg,
              isRecalled: true,
              recallType: recallType,
              originalMessage: msg.originalMessage || msg.message, // Store original message
              message: "Message has been recalled",
              pending: true // Show as pending until server confirms
            }
            : msg
        )
      }));
    } else {
      // Debug why the emit didn't happen
      console.error("Cannot emit recall-message:", {
        selectedMessageForActions: !!selectedMessageForActions,
        socketRef: !!socketRef.current,
        socketConnected: socketRef.current?.connected
      });
    }

    handleMoreActionsClose();
  };

  const handlePinMessage = () => {
    console.log("Pin/Unpin message:", selectedMessageForActions);

    if (selectedMessageForActions && socketRef.current) {
      const messageId = selectedMessageForActions.id;
      const conversationId = selectedConversation.id;
      const isPinned = selectedMessageForActions.isPinned || selectedMessageForActions.pinned;

      // Send pin/unpin request via socket - matching backend PinMessageRequest structure
      const pinPayload = {
        messageId: messageId,
        conversationId: conversationId,
        pin: !isPinned // Backend expects isPin() boolean method, so we send 'pin' field
      };

      console.log("Emitting pin-message with payload:", pinPayload);
      socketRef.current.emit("pin-message", pinPayload);

      // Optimistically update the UI
      setMessagesMap(prevMessagesMap => ({
        ...prevMessagesMap,
        [conversationId]: prevMessagesMap[conversationId].map(msg =>
          msg.id === messageId
            ? { ...msg, isPinned: !isPinned, pinned: !isPinned, pending: true }
            : msg
        )
      }));

      // Update pinned messages state
      setPinnedMessages(prev => {
        const conversationPinned = prev[conversationId] || [];
        if (isPinned) {
          // Remove from pinned messages
          return {
            ...prev,
            [conversationId]: conversationPinned.filter(msg => msg.id !== messageId)
          };
        } else {
          // Add to pinned messages
          return {
            ...prev,
            [conversationId]: [...conversationPinned, { ...selectedMessageForActions, isPinned: true, pinned: true }]
          };
        }
      });

      // Show notification
      setNotification({
        open: true,
        message: `Message ${isPinned ? 'unpinned' : 'pinned'} successfully`,
        severity: 'success'
      });
    } else {
      console.error("Cannot emit pin-message:", {
        selectedMessageForActions: !!selectedMessageForActions,
        socketRef: !!socketRef.current,
        socketConnected: socketRef.current?.connected
      });
    }

    handleMoreActionsClose();
  };

  const handleOpenReactionPicker = (event, message) => {
    setReactionPickerAnchorEl(event.currentTarget);
    setSelectedMessageForReaction(message);
  };

  const handleCloseReactionPicker = () => {
    setReactionPickerAnchorEl(null);
    setSelectedMessageForReaction(null);
  };

  const handleReactionSelect = (reaction) => {
    console.log("Selected reaction:", reaction, "for message:", selectedMessageForReaction);

    if (selectedMessageForReaction && socketRef.current) {
      // Send reaction to backend via socket
      socketRef.current.emit("react-message", {
        messageId: selectedMessageForReaction.id,
        icon: reaction
      });

      console.log("Sent reaction:", reaction, "for message:", selectedMessageForReaction.id);
    }

    handleCloseReactionPicker();
  };

  // Reaction emoji options
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉'];

  // Handler for opening reaction details dialog
  const handleReactionDetailsOpen = (event, message) => {
    event.stopPropagation();

    // Process reaction data for the dialog
    const reactionGroups = {};

    message.reactions.forEach(reaction => {
      if (!reactionGroups[reaction.icon]) {
        reactionGroups[reaction.icon] = {
          icon: reaction.icon,
          count: 0,
          users: [],
          reactedByMe: false
        };
      }
      reactionGroups[reaction.icon].count += reaction.count;
      if (reaction.reactedByMe) {
        reactionGroups[reaction.icon].reactedByMe = true;
      }

      // Handle user data from backend
      if (reaction.users && Array.isArray(reaction.users)) {
        // If backend sends user details
        reactionGroups[reaction.icon].users.push(...reaction.users);
      } else if (reaction.users) {
        // Handle other user data formats
        reactionGroups[reaction.icon].users.push(...reaction.users);
      }
    });

    setSelectedMessageForReactionDetails(message);
    setReactionDetailsData(Object.values(reactionGroups));
    setReactionDetailsOpen(true);
  };

  const handleReactionDetailsClose = () => {
    setReactionDetailsOpen(false);
    setSelectedMessageForReactionDetails(null);
    setReactionDetailsData([]);
  };

  // File handling functions
  const handleFileSelection = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      handleFileSelect(file);
      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  };

  const handleSendMediaMessage = async () => {
    if (!selectedFile || !selectedConversation) return;

    // Get the caption from the message input
    const caption = message.trim() || null;

    // Clear the message input immediately
    setMessage("");

    setIsUploadingFile(true);
    try {
      if (replyingTo) {
        await sendSocketMediaReply(
          socketRef,
          selectedConversation.id,
          selectedFile,
          replyingTo.id,
          caption
        );
        // Clear reply state
        setReplyingTo(null);
      } else {
        await sendSocketMediaMessage(
          socketRef,
          selectedConversation.id,
          selectedFile,
          caption
        );
      }
    } catch (error) {
      console.error("Error sending media message:", error);
      setNotification({
        open: true,
        message: `Failed to send media message: ${error.message}`,
        severity: 'error'
      });
      setIsUploadingFile(false);
    }
  };

  const handleCancelFileSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessage(""); // Clear message input (caption)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const getFileIcon = (fileName, size = 'medium') => {
    const iconSize = size === 'small' ? 'small' : 'medium';

    if (!fileName) return <AttachFileIcon fontSize={iconSize} />;

    const extension = fileName.toLowerCase().split('.').pop();
    const mimeType = fileName.includes('application/') ? fileName : '';

    // Handle specific file types by extension and MIME type
    if (extension === 'pdf' || mimeType.includes('pdf')) {
      return <PictureAsPdfIcon fontSize={iconSize} color="error" />;
    }

    // Microsoft Word documents
    if (extension === 'doc' || extension === 'docx' ||
      mimeType.includes('wordprocessingml.document') ||
      mimeType.includes('msword')) {
      return <ArticleIcon fontSize={iconSize} color="primary" />;
    }

    // Microsoft Excel documents
    if (extension === 'xls' || extension === 'xlsx' ||
      mimeType.includes('spreadsheetml.sheet') ||
      mimeType.includes('ms-excel')) {
      return <TableChartIcon fontSize={iconSize} color="success" />;
    }

    // Microsoft PowerPoint documents
    if (extension === 'ppt' || extension === 'pptx' ||
      mimeType.includes('presentationml.presentation') ||
      mimeType.includes('ms-powerpoint')) {
      return <SlideshowIcon fontSize={iconSize} color="warning" />;
    }

    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <FolderZipIcon fontSize={iconSize} color="info" />;
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return <ImageIcon fontSize={iconSize} color="secondary" />;
    }

    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return <VideoLibraryIcon fontSize={iconSize} color="secondary" />;
    }

    // Audio
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(extension)) {
      return <AudioFileIcon fontSize={iconSize} color="secondary" />;
    }

    // Text files
    if (['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(extension)) {
      return <DescriptionIcon fontSize={iconSize} />;
    }

    // Default file icon
    return <AttachFileIcon fontSize={iconSize} />;
  };

  // Handler for removing user's reaction - UPDATED for immediate dialog update
  const handleRemoveMyReaction = (messageId, icon) => {
    if (socketRef.current) {
      // Use the new 'remove-reaction' event
      socketRef.current.emit("remove-reaction", {
        messageId: messageId,
        icon: icon
      });
      console.log("Removing reaction:", icon, "from message:", messageId);

      // Immediately update the dialog data to remove the reaction
      setReactionDetailsData(prevData =>
        prevData.filter(reaction => reaction.icon !== icon)
      );

      // Also update the message in messagesMap immediately for instant UI feedback
      if (selectedConversation) {
        setMessagesMap(prevMessagesMap => ({
          ...prevMessagesMap,
          [selectedConversation.id]: prevMessagesMap[selectedConversation.id].map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                reactions: msg.reactions.filter(reaction =>
                  !(reaction.icon === icon && reaction.reactedByMe)
                )
              }
              : msg
          )
        }));
      }
    }

    // Close dialog if no more reactions
    if (reactionDetailsData.length <= 1) {
      handleReactionDetailsClose();
    }
  };

  return (

    <Scene darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <ForwardDialog
        open={forwardDialogOpen}
        onClose={() => setForwardDialogOpen(false)}
        onForward={handleForward}
        conversations={conversations}
        currentConversation={selectedConversation}
      />
      <Card
        elevation={0}
        sx={{
          width: "100%",
          height: "calc(100vh - 64px)",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          borderRadius: 0,
          backgroundColor: "background.default",
          border: "none",
        }}
      >
        {/* Conversations List */}
        <Box
          sx={{
            width: { xs: 280, sm: 300, md: 320 },
            minWidth: 280,
            maxWidth: 350,
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.paper",
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.02) 100%)',
          }}
        >
          <Box
            sx={{
              p: 2.5,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "background.paper",
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6">Chats</Typography>
            <IconButton
              color="primary"
              size="small"
              onClick={handleNewChatClick}
              sx={{
                bgcolor: "primary.light",
                color: "white",
                "&:hover": {
                  bgcolor: "primary.main",
                },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>{" "}
            <NewChatPopover
              anchorEl={newChatAnchorEl}
              open={Boolean(newChatAnchorEl)}
              onClose={handleCloseNewChat}
              onSelectUser={handleSelectNewChatUser}
              onCreateGroup={handleCreateGroupConversation}
            />
          </Box>{" "}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            {(() => {
              if (loading) {
                return (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress size={28} />
                  </Box>
                );
              }
              if (error) {
                return (
                  <Box sx={{ p: 2 }}>
                    <Alert
                      severity="error"
                      sx={{ mb: 2 }}
                      action={
                        <IconButton
                          color="inherit"
                          size="small"
                          onClick={fetchConversations}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      {error}
                    </Alert>
                  </Box>
                );
              }
              if (conversations == null || conversations.length === 0) {
                return (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography color="text.secondary">
                      No conversations yet. Start a new chat to begin.
                    </Typography>
                  </Box>
                );
              }
              return (
                <List sx={{ width: "100%" }}>
                  {conversations.map((conversation) => (
                    <React.Fragment key={conversation.id}>
                      {" "}
                      <ListItem
                        alignItems="flex-start"
                        onClick={() => handleConversationSelect(conversation)}
                        sx={{
                          cursor: "pointer",
                          bgcolor:
                            selectedConversation?.id === conversation.id
                              ? "rgba(0, 0, 0, 0.04)"
                              : "transparent",
                          "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.08)",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="error"
                            badgeContent={conversation.unreadCount}
                            invisible={!conversation.unreadCount || conversation.unreadCount === 0}
                            overlap="circular"
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.75rem',
                                minWidth: '18px',
                                height: '18px',
                                padding: '0 4px'
                              }
                            }}
                          >
                            <Avatar
                              src={conversation.conversationAvatar || ""}
                            />
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              display={"flex"}
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                noWrap
                                sx={{ display: "inline" }}
                                fontWeight={conversation.unreadCount > 0 ? "bold" : "normal"}

                              >
                                {conversation.conversationName}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: "inline", fontSize: "0.7rem" }}
                              >
                                {new Date(
                                  conversation.modifiedDate
                                ).toLocaleString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                              <Typography
                                sx={{
                                  display: "inline",
                                  fontStyle: conversation.lastMessage?.isRecalled ? 'italic' : 'normal',
                                  opacity: conversation.lastMessage?.isRecalled ? 0.7 : 1
                                }}
                                component="span"
                                variant="body2"
                                color={conversation.lastMessage?.isRecalled ? "text.secondary" : "text.primary"}
                                fontWeight={conversation.unreadCount > 0 ? "bold" : "normal"}
                                noWrap
                              >
                                {renderLastMessage(conversation)}
                              </Typography>

                              {/* Show status for sender's last message */}
                              {(() => {
                                if (conversation.lastMessage?.me && conversation.lastMessage?.status) {
                                  return (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ fontSize: '0.7rem' }}
                                    >
                                      {conversation.lastMessage.status === 'sent' && '✅ sent'}
                                      {conversation.lastMessage.status === 'seen' &&
                                        `✅✅ seen at ${conversation.lastMessage.readAt ?
                                          new Date(conversation.lastMessage.readAt).toLocaleString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                          }) : ''}`
                                      }
                                    </Typography>
                                  );
                                }
                                return null;
                              })()}
                            </Box>
                          }
                          primaryTypographyProps={{
                            fontWeight:
                              conversation.unreadCount > 0 ? "bold" : "normal",
                          }}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            pr: 1,
                          }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              );
            })()}
          </Box>
        </Box>

        {/* Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "row",
            minWidth: 0, // Allows the box to shrink below its content width
            backgroundColor: "background.default",
          }}
        >
          {/* Main Chat Container */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              position: 'relative', // Add relative positioning for absolute children
            }}
          >
            {selectedConversation ? (
              <>
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "background.paper",
                    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.02) 100%)',
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      src={selectedConversation.conversationAvatar}
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="h6">
                      {selectedConversation.conversationName}
                    </Typography>
                  </Box>

                  {/* Header Action Buttons */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Add Members Button - Only show for group conversations */}
                    {selectedConversation.type === 'GROUP' && (
                      <IconButton
                        onClick={() => setShowAddMembersDialog(true)}
                        color="default"
                        sx={{
                          bgcolor: "transparent",
                          "&:hover": {
                            bgcolor: "grey.100",
                          },
                        }}
                        title="Add Members"
                      >
                        <GroupAddIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* Conversation Info Button */}
                    <IconButton
                      onClick={() => setShowConversationInfo(!showConversationInfo)}
                      color={showConversationInfo ? "primary" : "default"}
                      sx={{
                        bgcolor: showConversationInfo ? "" : "transparent",
                        "&:hover": {
                          bgcolor: showConversationInfo ? "" : "grey.100",
                        },
                      }}
                      title="Conversation Information"
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>

                    {/* Pinned Messages Toggle Button */}
                    <IconButton
                      onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                      color={showPinnedMessages ? "primary" : "default"}
                      sx={{
                        bgcolor: showPinnedMessages ? "primary.light" : "transparent",
                        "&:hover": {
                          bgcolor: showPinnedMessages ? "primary.main" : "grey.100",
                        },
                      }}
                      title="Pinned Messages"
                    >
                      <PushPinIcon fontSize="small" />
                      {pinnedMessages[selectedConversation.id]?.length > 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 0.5,
                            bgcolor: "error.main",
                            color: "white",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                          }}
                        >
                          {pinnedMessages[selectedConversation.id]?.length}
                        </Typography>
                      )}
                    </IconButton>
                  </Box>
                </Box>{" "}
                <Box
                  id="messageContainer"
                  ref={messageContainerRef}
                  onScroll={handleScroll}
                  sx={{
                    flexGrow: 1,
                    p: 2,
                    overflowY: "auto",
                    overflowX: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    // Smooth scrolling
                    scrollBehavior: "smooth",
                    // Custom scrollbar styling
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: 'rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {" "}
                  {/* Show indicator when filtering to pinned messages only */}
                  {showPinnedMessages && (
                    <Box
                      sx={{
                        bgcolor: "primary.light",
                        color: "white",
                        p: 1,
                        textAlign: "center",
                        mb: 1,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      <PushPinIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Showing only pinned messages ({currentMessages.filter(msg => msg.isPinned || msg.pinned).length})
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      margin:
                        "auto 0 0 0" /* Push to bottom, but allow scrolling */,
                      px: 1
                    }}
                  >
                    {(() => {
                      const filteredMessages = currentMessages.filter(msg => {
                        // If showPinnedMessages is true, only show pinned messages
                        if (showPinnedMessages) {
                          return msg.isPinned || msg.pinned;
                        }
                        // Otherwise show all messages
                        return true;
                      });

                      // Show "no pinned messages" when filtering and no pinned messages found
                      if (showPinnedMessages && filteredMessages.length === 0) {
                        return (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "200px",
                              textAlign: "center",
                            }}
                          >
                            <PushPinOutlinedIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                              No pinned messages
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Pin important messages to find them easily later
                            </Typography>
                          </Box>
                        );
                      }

                      return filteredMessages.map((msg, index) => {
                        // console.log("Rendering message:", msg);

                        // Special rendering for SYSTEM messages - centered, minimal style
                        if (msg.type === 'SYSTEM' || msg.type === 'SYSTEM_ADD_MEMBERS' || msg.type === 'SYSTEM_REMOVE_MEMBERS' || msg.type === 'SYSTEM_LEAVE_GROUP' || msg.type === "SYSTEM_EDIT_GROUP_NAME" || msg.type === "SYSTEM_EDIT_GROUP_AVATAR") {
                          return (
                            <Box
                              key={msg.id}
                              id={`message-${msg.id}`}
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                mb: 2,
                                px: 2,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  fontStyle: "italic",
                                  textAlign: "center",
                                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                                  borderRadius: 1,
                                  px: 2,
                                  py: 1,
                                  maxWidth: "80%",
                                }}
                              >
                                {msg.message}
                              </Typography>
                            </Box>
                          );
                        }

                        // Extract background color logic to avoid nested ternary
                        let backgroundColor = theme.palette.action.hover; // default for others
                        if (msg.me) {
                          backgroundColor = msg.failed
                            ? theme.palette.error.light + '20'
                            : theme.palette.primary.light + '30';
                        }

                        // Check if this is the last message from the sender
                        const isLastMessageFromSender = msg.me && index === currentMessages.length - 1;

                        return (
                          <Box
                            key={msg.id}
                            id={`message-${msg.id}`}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: msg.me ? "flex-end" : "flex-start",
                              mb: 3, // Increased margin to accommodate reactions below
                              position: "relative",
                            }}
                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            {/* Message row */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: msg.me ? "flex-end" : "flex-start",
                                alignItems: "center",
                                width: "100%",
                                position: "relative",
                                gap: 1,
                              }}
                            >

                              {/* Action buttons for sender's messages (LEFT side) */}
                              {msg.me && hoveredMessageId === msg.id && !msg.isRecalled && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    bgcolor: "background.paper",
                                    boxShadow: 2,
                                    borderRadius: 1,
                                    p: 0.5,
                                    order: 1, // Hiển thị trước message
                                    border: 1,
                                    borderColor: "divider",
                                  }}
                                >
                                  {!msg.isRecalled && [
                                    <IconButton
                                      key="reply"
                                      size="small"
                                      onClick={() => handleReply(msg)}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        "&:hover": { bgcolor: "action.hover" }
                                      }}
                                    >
                                      <ReplyIcon fontSize="small" />
                                    </IconButton>,
                                    <IconButton
                                      key="reaction"
                                      size="small"
                                      onClick={(e) => handleOpenReactionPicker(e, msg)}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        "&:hover": { bgcolor: "action.hover" }
                                      }}
                                    >
                                      <EmojiEmotionsIcon fontSize="small" />
                                    </IconButton>
                                  ]}
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Ngăn event bubbling
                                      handleMoreActionsClick(e, msg);
                                    }}
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      "&:hover": { bgcolor: "action.hover" }
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                  {/* Reaction Picker Menu */}
                                  <Menu
                                    anchorEl={reactionPickerAnchorEl}
                                    open={Boolean(reactionPickerAnchorEl)}
                                    onClose={handleCloseReactionPicker}
                                    anchorOrigin={{
                                      vertical: 'bottom',
                                      horizontal: 'center',
                                    }}
                                    transformOrigin={{
                                      vertical: 'top',
                                      horizontal: 'center',
                                    }}
                                    sx={{
                                      '& .MuiPaper-root': {
                                        borderRadius: 2,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      {reactionEmojis.map((emoji) => (
                                        <IconButton
                                          key={emoji}
                                          onClick={() => handleReactionSelect(emoji)}
                                          sx={{
                                            fontSize: '15px',
                                            width: 30,
                                            height: 20,
                                            '&:hover': {
                                              bgcolor: 'grey.100',
                                              transform: 'scale(1.2)',
                                            },
                                            transition: 'all 0.2s ease-in-out',
                                          }}
                                        >
                                          {emoji}
                                        </IconButton>
                                      ))}
                                    </Box>
                                  </Menu>

                                  {/* More Actions Menu for sender */}
                                  <Menu
                                    anchorEl={selectedMessageForActions?.id === msg.id ? moreActionsAnchorEl : null}
                                    open={Boolean(moreActionsAnchorEl) && selectedMessageForActions?.id === msg.id}
                                    onClose={handleMoreActionsClose}
                                    anchorOrigin={{
                                      vertical: 'bottom',
                                      horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                      vertical: 'top',
                                      horizontal: 'right',
                                    }}
                                  >
                                    {!msg.isRecalled && [
                                      <MenuItem key="edit" onClick={() => handleEditMessage(msg)}>
                                        <ListItemIcon>
                                          <EditIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Edit</ListItemText>
                                      </MenuItem>,
                                      <MenuItem key="recall-self" onClick={() => handleRecallMessage("self")}>
                                        <ListItemIcon>
                                          <DeleteIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Recall for me</ListItemText>
                                      </MenuItem>,
                                      <MenuItem key="recall-everyone" onClick={() => handleRecallMessage("everyone")}>
                                        <ListItemIcon>
                                          <DeleteIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Recall for everyone</ListItemText>
                                      </MenuItem>,
                                      <MenuItem key="forward" onClick={() => { handleForwardClick(msg.id); handleMoreActionsClose(); }}>
                                        <ListItemIcon>
                                          <ReplyIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Forward</ListItemText>
                                      </MenuItem>
                                    ]}



                                    <MenuItem onClick={handlePinMessage}>
                                      <ListItemIcon>
                                        {(msg.isPinned || msg.pinned) ? (
                                          <PushPinIcon fontSize="small" />
                                        ) : (
                                          <PushPinOutlinedIcon fontSize="small" />
                                        )}
                                      </ListItemIcon>
                                      <ListItemText>
                                        {(msg.isPinned || msg.pinned) ? 'Unpin' : 'Pin'}
                                      </ListItemText>
                                    </MenuItem>
                                  </Menu>
                                </Box>
                              )}

                              {!msg.me && (
                                <Avatar
                                  src={msg.sender?.avatar}
                                  sx={{
                                    mr: 1,
                                    alignSelf: "flex-end",
                                    width: 32,
                                    height: 32,
                                  }}
                                />
                              )}

                              {/* Message container with relative positioning for reactions */}
                              <Box
                                sx={{
                                  position: 'relative',
                                  maxWidth: "70%",
                                  order: 2,
                                }}
                              >
                                <Paper
                                  elevation={1}
                                  sx={{
                                    p: 2,
                                    backgroundColor,
                                    borderRadius: 2,
                                    opacity: msg.pending ? 0.7 : 1,
                                  }}
                                >
                                  {/* Show reply information if this is a reply */}
                                  {msg.replyToMessage && (
                                    <Box
                                      sx={{
                                        borderLeft: 3,
                                        borderColor: "primary.main",
                                        pl: 1,
                                        mb: 1,
                                        bgcolor: "action.selected",
                                        borderRadius: 1,
                                        p: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        color="primary"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Replying to {msg.replyToMessage.me ? "You" : msg.replyToMessage.sender?.firstName}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          maxWidth: "200px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5
                                        }}
                                      >
                                        {msg.replyToMessage.mediaType ? (
                                          <>
                                            {getFileIcon(msg.replyToMessage.fileName, 'small')}
                                            {msg.replyToMessage.mediaType === 'image' && 'Image'}
                                            {msg.replyToMessage.mediaType === 'video' && 'Video'}
                                            {msg.replyToMessage.mediaType === 'audio' && 'Audio'}
                                            {msg.replyToMessage.mediaType === 'document' && (msg.replyToMessage.fileName || 'Document')}
                                            {msg.replyToMessage.message && ` - ${msg.replyToMessage.message}`}
                                          </>
                                        ) : (
                                          msg.replyToMessage.message
                                        )}
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Pin indicator */}
                                  {(msg.isPinned || msg.pinned) && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        mb: 1,
                                        color: "primary.main",
                                      }}
                                    >
                                      <PushPinIcon fontSize="small" />
                                      <Typography
                                        variant="caption"
                                        color="primary.main"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Pinned Message
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Message content - text or media */}
                                  {msg.isRecalled ? (
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontStyle: 'italic',
                                        color: 'text.secondary',
                                        opacity: 0.7
                                      }}
                                    >
                                      {msg.message}
                                      {msg.pending && (
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          sx={{ ml: 1, color: 'warning.main' }}
                                        >
                                          (Processing...)
                                        </Typography>
                                      )}
                                    </Typography>
                                  ) : msg.mediaType ? (
                                    // Media Message Rendering
                                    <Box sx={{ maxWidth: '100%' }}>
                                      {msg.mediaType.startsWith('image/') && (
                                        <Box
                                          sx={{
                                            position: 'relative',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            maxWidth: 300,
                                            cursor: 'pointer'
                                          }}
                                          onClick={() => {
                                            if (msg.mediaUrl) {
                                              window.open(msg.mediaUrl, '_blank');
                                            }
                                          }}
                                        >
                                          <img
                                            src={msg.mediaUrl || msg.previewUrl}
                                            alt={msg.fileName || 'Image'}
                                            style={{
                                              width: '100%',
                                              height: 'auto',
                                              maxHeight: 200,
                                              objectFit: 'cover',
                                              display: 'block'
                                            }}
                                            onLoad={() => {
                                              // Scroll to bottom when image loads
                                              setTimeout(() => {
                                                messageContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
                                              }, 100);
                                            }}
                                          />
                                          {msg.uploading && (
                                            <Box
                                              sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column'
                                              }}
                                            >
                                              <CircularProgress size={30} color="primary" />
                                              <Typography variant="caption" color="white" sx={{ mt: 1 }}>
                                                Uploading...
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      )}

                                      {msg.mediaType.startsWith('video/') && (
                                        <Box
                                          sx={{
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            maxWidth: 300,
                                            backgroundColor: 'black'
                                          }}
                                        >
                                          <video
                                            controls
                                            style={{
                                              width: '100%',
                                              height: 'auto',
                                              maxHeight: 200,
                                              display: 'block'
                                            }}
                                            preload="metadata"
                                          >
                                            <source src={msg.mediaUrl} type={`video/${msg.fileName?.split('.').pop()}`} />
                                            Your browser does not support video playback.
                                          </video>
                                          {msg.uploading && (
                                            <Box
                                              sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column'
                                              }}
                                            >
                                              <CircularProgress size={30} color="primary" />
                                              <Typography variant="caption" color="white" sx={{ mt: 1 }}>
                                                Uploading...
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      )}

                                      {msg.mediaType.startsWith('audio/') && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            p: 1,
                                            borderRadius: 1,
                                            backgroundColor: 'action.hover',
                                            minWidth: 200
                                          }}
                                        >
                                          <VolumeUpIcon color="primary" />
                                          <Box sx={{ flex: 1 }}>
                                            <audio
                                              controls
                                              style={{ width: '100%', height: 32 }}
                                              preload="metadata"
                                            >
                                              <source src={msg.mediaUrl} type={`audio/${msg.fileName?.split('.').pop()}`} />
                                              Your browser does not support audio playback.
                                            </audio>
                                          </Box>
                                          {msg.uploading && (
                                            <CircularProgress size={20} color="primary" />
                                          )}
                                        </Box>
                                      )}

                                      {/* Document and File Rendering - handles all non-media files */}
                                      {(msg.mediaType && !msg.mediaType.startsWith('image/') &&
                                        !msg.mediaType.startsWith('video/') &&
                                        !msg.mediaType.startsWith('audio/')) && (
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 1.5,
                                              p: 1.5,
                                              borderRadius: 2,
                                              backgroundColor: 'action.hover',
                                              cursor: msg.mediaUrl ? 'pointer' : 'default',
                                              border: 1,
                                              borderColor: 'divider',
                                              minWidth: 250,
                                              maxWidth: 350,
                                              '&:hover': msg.mediaUrl ? {
                                                backgroundColor: 'action.selected',
                                                borderColor: 'primary.main',
                                                transform: 'scale(1.02)'
                                              } : {},
                                              transition: 'all 0.2s ease-in-out'
                                            }}
                                            onClick={() => {
                                              if (msg.mediaUrl) {
                                                // Create a temporary link to download the file
                                                const link = document.createElement('a');
                                                link.href = msg.mediaUrl;
                                                link.download = msg.fileName || 'download';
                                                link.target = '_blank';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                              }
                                            }}
                                          >
                                            {getFileIcon(msg.fileName || msg.mediaType)}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  fontWeight: 'medium',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap',
                                                  color: 'text.primary'
                                                }}
                                              >
                                                {msg.fileName || 'Unknown File'}
                                              </Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                {msg.fileSize && (
                                                  <Typography variant="caption" color="text.secondary">
                                                    {(msg.fileSize / (1024 * 1024)).toFixed(2)} MB
                                                  </Typography>
                                                )}

                                              </Box>
                                            </Box>
                                            {msg.uploading ? (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                <CircularProgress size={20} color="primary" />
                                                <Typography variant="caption" color="text.secondary">
                                                  Uploading...
                                                </Typography>
                                              </Box>
                                            ) : msg.mediaUrl && (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                <FileDownloadIcon color="primary" />
                                                <Typography variant="caption" color="primary" sx={{ fontSize: '0.65rem' }}>
                                                  Download
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        )}

                                      {/* Caption for media messages */}
                                      {msg.message && msg.message.trim() && (
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            mt: 1,
                                            color: 'text.primary'
                                          }}
                                        >
                                          {msg.message}
                                        </Typography>
                                      )}
                                    </Box>
                                  ) : (
                                    // Regular Text Message
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: 'text.primary'
                                      }}
                                    >
                                      {msg.message}
                                    </Typography>
                                  )}

                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    justifyContent="flex-end"
                                    sx={{ mt: 1 }}
                                  >
                                    {msg.failed && (
                                      <Typography variant="caption" color="error">
                                        Failed to send
                                      </Typography>
                                    )}
                                    {msg.pending && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Sending...
                                      </Typography>
                                    )}

                                    <Typography
                                      variant="caption"
                                      sx={{ display: "block", textAlign: "right" }}
                                    >
                                      {new Date(msg.createdDate).toLocaleString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </Typography>
                                  </Stack>
                                </Paper>

                                {/* Display message reactions - positioned outside message box */}
                                {msg.reactions && msg.reactions.length > 0 && !msg.isRecalled && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      bottom: -15, // Position below the message box
                                      [msg.me ? 'left' : 'right']: -12, // Bottom left for sender, bottom right for receiver
                                      zIndex: 1,
                                    }}
                                  >
                                    <Paper
                                      elevation={2}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 3,
                                        bgcolor: 'action.hover',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        '&:hover': {
                                          bgcolor: 'action.selected',
                                          transform: 'scale(1.02)',
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {(() => {
                                        // Group reactions by icon and calculate total count
                                        const reactionGroups = {};
                                        let totalReactionCount = 0;
                                        let hasMyReaction = false;

                                        msg.reactions.forEach(reaction => {
                                          if (!reactionGroups[reaction.icon]) {
                                            reactionGroups[reaction.icon] = {
                                              icon: reaction.icon,
                                              count: 0,
                                              reactedByMe: false
                                            };
                                          }
                                          reactionGroups[reaction.icon].count += reaction.count;
                                          totalReactionCount += reaction.count;

                                          if (reaction.reactedByMe) {
                                            reactionGroups[reaction.icon].reactedByMe = true;
                                            hasMyReaction = true;
                                          }
                                        });

                                        // Get unique reaction icons
                                        const uniqueReactions = Object.values(reactionGroups);

                                        return (
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 0.3,
                                              cursor: 'pointer',
                                              // px: 0.2,
                                              py: 0.2,
                                              borderRadius: 2,

                                              transition: 'all 0.2s ease-in-out',
                                            }}
                                            onClick={(event) => {
                                              handleReactionDetailsOpen(event, msg);
                                            }}
                                          >
                                            {/* Display all reaction icons */}
                                            <Box
                                              className="reaction-icons"
                                              sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.2,
                                                transition: 'transform 0.2s ease-in-out',
                                              }}
                                            >
                                              {uniqueReactions
                                                .sort((a, b) => b.count - a.count) // Sort by popularity
                                                .slice(0, 3) // Show max 3 different icons
                                                .map((reaction, index) => (
                                                  <span
                                                    key={reaction.icon}
                                                    style={{
                                                      fontSize: '14px',
                                                      lineHeight: 1,
                                                      opacity: index === 0 ? 1 : 0.8 - (index * 0.2) // Fade less popular ones
                                                    }}
                                                  >
                                                    {reaction.icon}
                                                  </span>
                                                ))}
                                              {uniqueReactions.length > 3 && (
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    fontSize: '0.6rem',
                                                    color: 'grey.600',
                                                    fontWeight: 'bold',
                                                  }}
                                                >
                                                  +{uniqueReactions.length - 3}
                                                </Typography>
                                              )}
                                            </Box>

                                            {/* Display total count */}
                                            <Typography
                                              variant="caption"
                                              className="reaction-count"
                                              sx={{
                                                fontWeight: 'bold',
                                                color: hasMyReaction ? 'grey.700' : 'grey.700',
                                                transition: 'color 0.2s ease-in-out',
                                                fontSize: '0.75rem',
                                                minWidth: '16px',
                                                textAlign: 'center',
                                                lineHeight: 1,
                                              }}
                                            >
                                              {totalReactionCount}
                                            </Typography>
                                          </Box>
                                        );
                                      })()}
                                    </Paper>
                                  </Box>
                                )}
                              </Box>

                              {msg.me && (
                                <Avatar
                                  sx={{
                                    ml: 1,
                                    alignSelf: "flex-end",
                                    width: 32,
                                    height: 32,
                                    bgcolor: "#1976d2",
                                    order: 3, // Avatar của sender ở cuối
                                  }}
                                >
                                  You
                                </Avatar>
                              )}

                              {/* Action buttons for received messages (RIGHT side) */}
                              {!msg.me && hoveredMessageId === msg.id && !msg.isRecalled && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    bgcolor: "background.paper",
                                    boxShadow: 2,
                                    borderRadius: 1,
                                    p: 0.5,
                                    order: 3, // Hiển thị sau message
                                    border: 1,
                                    borderColor: "divider",
                                  }}
                                >
                                  {!msg.isRecalled && [
                                    <IconButton
                                      key="reply"
                                      size="small"
                                      onClick={() => handleReply(msg)}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        "&:hover": { bgcolor: "action.hover" }
                                      }}
                                    >
                                      <ReplyIcon fontSize="small" />
                                    </IconButton>,
                                    <IconButton
                                      key="reaction"
                                      size="small"
                                      onClick={(e) => handleOpenReactionPicker(e, msg)}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        "&:hover": { bgcolor: "action.hover" }
                                      }}
                                    >
                                      <EmojiEmotionsIcon fontSize="small" />
                                    </IconButton>
                                  ]}
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      forwardMessage({
                                        fromUserId: getCurrentUserId(),
                                        toConversationId: selectedConversation.id,
                                        messageId: msg.id,
                                        socket: socketRef.current
                                      });
                                    }}
                                  >
                                    <ForwardIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Ngăn event bubbling
                                      handleMoreActionsClick(e, msg);
                                    }}
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      "&:hover": { bgcolor: "action.hover" }
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                  {/* Reaction Picker Menu */}
                                  <Menu
                                    anchorEl={reactionPickerAnchorEl}
                                    open={Boolean(reactionPickerAnchorEl)}
                                    onClose={handleCloseReactionPicker}
                                    anchorOrigin={{
                                      vertical: 'bottom',
                                      horizontal: 'center',
                                    }}
                                    transformOrigin={{
                                      vertical: 'top',
                                      horizontal: 'center',
                                    }}
                                    sx={{
                                      '& .MuiPaper-root': {
                                        borderRadius: 2,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      {reactionEmojis.map((emoji) => (
                                        <IconButton
                                          key={emoji}
                                          onClick={() => handleReactionSelect(emoji)}
                                          sx={{
                                            fontSize: '15px',
                                            width: 30,
                                            height: 20,
                                            '&:hover': {
                                              bgcolor: 'grey.100',
                                              transform: 'scale(1.2)',
                                            },
                                            transition: 'all 0.2s ease-in-out',
                                          }}
                                        >
                                          {emoji}
                                        </IconButton>
                                      ))}
                                    </Box>
                                  </Menu>

                                  {/* More Actions Menu for receiver */}
                                  <Menu
                                    anchorEl={selectedMessageForActions?.id === msg.id ? moreActionsAnchorEl : null}
                                    open={Boolean(moreActionsAnchorEl) && selectedMessageForActions?.id === msg.id}
                                    onClose={handleMoreActionsClose}
                                    anchorOrigin={{
                                      vertical: 'bottom',
                                      horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                      vertical: 'top',
                                      horizontal: 'left',
                                    }}
                                  >
                                    <MenuItem onClick={handlePinMessage}>
                                      <ListItemIcon>
                                        {(msg.isPinned || msg.pinned) ? (
                                          <PushPinIcon fontSize="small" />
                                        ) : (
                                          <PushPinOutlinedIcon fontSize="small" />
                                        )}
                                      </ListItemIcon>
                                      <ListItemText>
                                        {(msg.isPinned || msg.pinned) ? 'Unpin' : 'Pin'}
                                      </ListItemText>
                                    </MenuItem>
                                  </Menu>
                                </Box>
                              )}
                            </Box>

                            {/* Status indicators - only for last message from sender */}
                            {isLastMessageFromSender && msg.status && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  mt: 0.5,
                                  mr: 6, // Account for avatar width + margin
                                }}
                              >
                                {msg.status === 'SENT' && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: '0.65rem' }}
                                  >
                                    ✔️ Sent
                                  </Typography>
                                )}

                                {/* Use ReadReceipts component for group conversations */}
                                {selectedConversation?.type === 'GROUP' || selectedConversation?.conversationType === 'GROUP' ? (
                                  <ReadReceipts
                                    message={msg}
                                    conversationType={selectedConversation?.type || selectedConversation?.conversationType}
                                    currentUserId={getCurrentUserId()}
                                  />
                                ) : (
                                  /* For direct conversations, show traditional seen status */
                                  msg.status === 'SEEN' && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ fontSize: '0.65rem' }}
                                    >
                                      ✔️✔️ Seen at {msg.readDate && ` ${new Date(msg.readDate).toLocaleString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}`}
                                    </Typography>
                                  )
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      });
                    })()}
                  </Box>
                </Box>

                {/* Reply Preview Bar */}
                {replyingTo && (
                  <Box
                    sx={{
                      p: 1.5,
                      borderTop: 1,
                      borderColor: "divider",
                      bgcolor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <ReplyIcon fontSize="small" color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: "bold" }}>
                        Replying to {replyingTo.me ? "You" : replyingTo.sender?.firstName}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "300px",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5
                        }}
                      >
                        {replyingTo.mediaType ? (
                          <>
                            {getFileIcon(replyingTo.fileName, 'small')}
                            {replyingTo.mediaType === 'image' && 'Image'}
                            {replyingTo.mediaType === 'video' && 'Video'}
                            {replyingTo.mediaType === 'audio' && 'Audio'}
                            {replyingTo.mediaType === 'document' && (replyingTo.fileName || 'Document')}
                            {replyingTo.message && ` - ${replyingTo.message}`}
                          </>
                        ) : (
                          replyingTo.message
                        )}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleCancelReply}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                {/* Scroll to Bottom Button */}
                {!isNearBottom && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 80,
                      right: 20, // Keep it positioned relative to the main chat container
                      zIndex: 1000,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <IconButton
                      onClick={() => scrollToBottom(true)}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        boxShadow: 2,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      size="small"
                    >
                      <KeyboardArrowDownIcon />
                    </IconButton>
                  </Box>
                )}

                <Box
                  component="form"
                  sx={{
                    p: 2,
                    borderTop: replyingTo ? 0 : 1,
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    selectedFile ? handleSendMediaMessage() : handleSendMessage();
                  }}
                >
                  {/* File Preview Section */}
                  {selectedFile && (
                    <Box
                      sx={{
                        p: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(selectedFile.name)}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'medium',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200
                            }}
                          >
                            {selectedFile.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Box>

                      {/* File Preview for images */}
                      {filePreview && selectedFile.type.startsWith('image/') && (
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: 1,
                            borderColor: 'divider'
                          }}
                        >
                          <img
                            src={filePreview}
                            alt="Preview"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      )}

                      <IconButton
                        size="small"
                        onClick={handleCancelFileSelection}
                        color="error"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 1 }}>
                    {/* File attachment button */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileSelection}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    <IconButton
                      color="primary"
                      onClick={() => fileInputRef.current?.click()}
                      size="small"
                    >
                      <AttachFileIcon />
                    </IconButton>

                    <TextField
                      fullWidth
                      placeholder={
                        editingMessage 
                        ? `Edit your message...`
                        :selectedFile
                          ? `Add a caption for ${selectedFile.name}...`
                          : replyingTo
                            ? `Reply to ${replyingTo.me ? "yourself" : replyingTo.sender?.firstName}...`
                            : "Type a message"
                      }
                      variant="outlined"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      size="small"
                      InputProps={editingMessage ? {
                        endAdornment: (
                          <Button onClick={handleCancelEdit} color="secondary" size="small">
                            Cancel
                          </Button>
                        )
                      } : {}}
                    />
                    <IconButton
                      color="primary"
                      onClick={selectedFile ? handleSendMediaMessage : handleSendMessage}
                      disabled={!selectedFile && !message.trim()}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start chatting
                </Typography>
              </Box>
            )}
          </Box>

          {/* Conversation Info Panel */}
          {showConversationInfo && selectedConversation && (
            <ConversationInfoPanel
              key={`conv-info-${selectedConversation.id}-${selectedConversation.participants?.length || 0}`}
              conversation={selectedConversation}
              conversationAttachments={conversationAttachments}
              currentUserId={getCurrentUserId()}
              onClose={() => setShowConversationInfo(false)}
              onRemoveMembers={removeParticipantsFromGroup}
              onAddMembers={handleAddMembersToGroup}
              onLeaveGroup={leaveGroup}
              onEditGroupInfo={editGroupInfo}
            />
          )}
        </Box>
      </Card>
      {/* Reaction Details Dialog */}
      <Dialog
        open={reactionDetailsOpen}
        onClose={handleReactionDetailsClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Reactions</Typography>
            <IconButton
              onClick={handleReactionDetailsClose}
              sx={{ ml: 'auto' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {reactionDetailsData.length > 0 ? (
            <List sx={{ pt: 0 }}>
              {reactionDetailsData.map((reactionGroup, index) => {
                console.log('Reaction Group:', reactionGroup);
                return (
                  <React.Fragment key={reactionGroup.icon}>
                    <ListItem
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 2,
                        px: 0,
                      }}
                    >
                      {/* Reaction Header */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: reactionGroup.users && reactionGroup.users.length > 0 ? 2 : 0
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h4" sx={{ fontSize: '2rem' }}>
                            {reactionGroup.icon}
                          </Typography>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {reactionGroup.count} {reactionGroup.count === 1 ? 'reaction' : 'reactions'}
                            </Typography>
                          </Box>
                        </Box>

                        {reactionGroup.reactedByMe && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMyReaction(selectedMessageForReactionDetails?.id, reactionGroup.icon)}
                            sx={{ flexShrink: 0 }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>

                      {/* Users List */}
                      {reactionGroup.users && reactionGroup.users.length > 0 && (
                        <Box sx={{ pl: 1 }}>
                          {reactionGroup.users.slice(0, 10).map((user, userIndex) => (
                            <Box
                              key={userIndex}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                py: 1,
                                px: 1,
                                borderRadius: 1,
                                '&:hover': {
                                  bgcolor: 'grey.50'
                                }
                              }}
                            >
                              <Avatar
                                src={user.avatar || user.profilePicture}
                                sx={{ width: 32, height: 32 }}
                              >
                                {!user.avatar && !user.profilePicture && (
                                  user.name?.charAt(0) || user.username?.charAt(0) || user.firstName?.charAt(0) || '?'
                                )}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {user.name || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                                </Typography>
                                {user.username && user.name && (
                                  <Typography variant="caption" color="text.secondary">
                                    @{user.username}
                                  </Typography>
                                )}
                              </Box>
                              {user.reactedByMe && (
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                                  You
                                </Typography>
                              )}
                            </Box>
                          ))}

                          {reactionGroup.users.length > 10 && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ py: 1, px: 1, textAlign: 'center' }}
                            >
                              and {reactionGroup.users.length - 10} more...
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* No users data fallback */}
                      {(!reactionGroup.users || reactionGroup.users.length === 0) && (
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 1, py: 1 }}>
                          {reactionGroup.reactedByMe ? 'You reacted with this emoji' : 'Someone reacted with this emoji'}
                        </Typography>
                      )}
                    </ListItem>
                    {index < reactionDetailsData.length - 1 && <Divider />}
                  </React.Fragment>
                )
              })}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No reactions yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Be the first to react to this message!
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReactionDetailsClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog
        open={showAddMembersDialog}
        onClose={() => setShowAddMembersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Members to {selectedConversation?.conversationName}
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
              if (keyword.length > 2) {
                setSearchingUsers(true);
                try {
                  const response = await search(keyword);
                  const users = response?.data?.result || [];

                  // Filter out users who are already participants
                  const existingParticipantIds = selectedConversation?.participants?.map(p => p.userId) || [];
                  const availableUsers = users.filter(user => !existingParticipantIds.includes(user.userId));

                  setSearchUsersResults(availableUsers);
                } catch (error) {
                  console.error("Error searching users:", error);
                  setSearchUsersResults([]);
                } finally {
                  setSearchingUsers(false);
                }
              } else {
                setSearchUsersResults([]);
              }
            }}
            sx={{ mb: 2 }}
          />

          {searchingUsers && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {searchUsersResults.length > 0 && (
            <List>
              {searchUsersResults.map((user) => (
                <ListItem
                  key={user.userId}
                  button
                  onClick={() => {
                    if (selectedUsersForAdd.find(u => u.userId === user.userId)) {
                      setSelectedUsersForAdd(selectedUsersForAdd.filter(u => u.userId !== user.userId));
                    } else {
                      setSelectedUsersForAdd([...selectedUsersForAdd, user]);
                    }
                  }}
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
        <DialogActions>
          <Button onClick={() => {
            setShowAddMembersDialog(false);
            setSelectedUsersForAdd([]);
            setSearchUsersResults([]);
          }}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (selectedUsersForAdd.length === 0) return;

              try {
                const participantIds = selectedUsersForAdd.map(user => user.userId);
                await handleAddMembersToGroup(selectedConversation.id, participantIds);

                setNotification({
                  open: true,
                  message: `Successfully added ${selectedUsersForAdd.length} member(s) to the group`,
                  severity: 'success'
                });

                // Reset dialog state
                setShowAddMembersDialog(false);
                setSelectedUsersForAdd([]);
                setSearchUsersResults([]);

                // Refresh conversations to get updated member list
                fetchConversations();

              } catch (error) {
                console.error("Error adding members:", error);
                setNotification({
                  open: true,
                  message: error.message || "Failed to add members. Please check your connection.",
                  severity: 'error'
                });
              }
            }}
            variant="contained"
            disabled={selectedUsersForAdd.length === 0}
          >
            Add Members ({selectedUsersForAdd.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Scene>
  );
}

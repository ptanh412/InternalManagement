import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  CheckBadgeIcon,
  FaceSmileIcon as LaughIcon
} from '@heroicons/react/24/outline';
import { 
  Search,
  Phone,
  Video,
  Info,
  Pin,
  Image,
  File,
  CornerUpLeft,
  MoreVertical,
  Edit3,
  CornerUpRight,
  Trash2,
  X,
  Paperclip,
  Smile,
  Send,
  Check,
  Loader,
  PinOff,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import chatSocketService from '../../services/chatSocketService';
import chatApiService from '../../services/chatApiService';

const ChatPage = ({ role }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [selectedForForward, setSelectedForForward] = useState(null);
  const [searchMessages, setSearchMessages] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showReactionDetails, setShowReactionDetails] = useState(null);
  const [reactingToMessage, setReactingToMessage] = useState(new Set());

  const eventHandlersSetup = useRef(false);

  // Add these refs and states at the top of ChatPage component
  const messageRefs = useRef({});
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  

  useEffect(() => {
    initializeChat();
    return () => {
      chatSocketService.disconnect();
    };
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      chatSocketService.joinConversation(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Click outside handler for message actions
    const handleClickOutside = (event) => {
      if (showMessageActions && !event.target.closest('.message-actions-dropdown')) {
        setShowMessageActions(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMessageActions]);

  const initializeChat = async () => {
    try {
      setConnecting(true);
      
      // Load conversations first
      await loadConversations();
      
      // Connect to Socket.IO
      const token = localStorage.getItem('token');
      if (token) {
        chatSocketService.connect(token);
        setupSocketEventHandlers();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setConnecting(false);
      setLoading(false);
    }
  };

   // ✅ Setup socket handlers ONCE khi component mount
  useEffect(() => {
    if (!eventHandlersSetup.current) {
      setupSocketEventHandlers();
      eventHandlersSetup.current = true;
    }

    // ✅ Cleanup khi unmount
    return () => {
      chatSocketService.off('reaction-update');
      chatSocketService.off('pin-message-success');
      chatSocketService.off('unpin-message-success');
      chatSocketService.off('message');
      eventHandlersSetup.current = false;
    };
  }, []);

  const setupSocketEventHandlers = () => {

    chatSocketService.off('reaction-update');
    chatSocketService.off('pin-message-success');
    chatSocketService.off('unpin-message-success');
    // Connection events
    chatSocketService.on('connected', (data) => {
      console.log('Chat connected:', data);
      setConnecting(false);
    });

    chatSocketService.on('disconnected', (data) => {
      console.log('Chat disconnected:', data);
      setConnecting(true);
    });

    chatSocketService.on('connection_error', (data) => {
      console.error('Chat connection error:', data);
      setConnecting(false);
    });

    // Core message events (matching web-app patterns)
    chatSocketService.on('message', (messageData) => {
      console.log('Message received via Socket.IO:', messageData);
      handleIncomingMessage(messageData);
    });

    chatSocketService.on('reply-message', (messageData) => {
      console.log('Reply message received via Socket.IO:', messageData);
      handleIncomingMessage(messageData);
    });

    chatSocketService.on('message-status-update', (statusData) => {
      console.log('Message status update received:', statusData);
      handleMessageStatusUpdate(statusData);
    });

    chatSocketService.on('message-recalled', (data) => {
      handleMessageRecalled(data);
    });

    chatSocketService.on('message-pinned', (data) => {
      handleMessagePinned(data);
    });

    // ✅ Pin/Unpin events - these will now be handled by system messages through handleIncomingMessage
    chatSocketService.on('pin-message-success', (data) => {
      console.log('Pin success:', data);
      // System message for pin/unpin will be handled by handleIncomingMessage
      // No need to manually increment unreadCount here
    });

    chatSocketService.on('unpin-message-success', (data) => {
      console.log('Unpin success:', data);
      // System message for pin/unpin will be handled by handleIncomingMessage  
      // No need to manually increment unreadCount here
    });

    chatSocketService.on('pin-message-error', (data) => {
      console.error('Pin/unpin error:', data.error);
      // Show error notification
    });

    // Media message events
    chatSocketService.on('media-message-success', (data) => {
      console.log('Media message sent successfully:', data);
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, data]);
      }
      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId 
            ? { ...conv, lastMessage: data, updatedAt: new Date().toISOString() }
            : conv
        )
      );
    });

    chatSocketService.on('media-message-error', (data) => {
      console.error('Media message error:', data.error);
      // Show error notification
    });

    chatSocketService.on('media-reply-success', (data) => {
      console.log('Media reply sent successfully:', data);
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, data]);
      }
    });

    chatSocketService.on('media-reply-error', (data) => {
      console.error('Media reply error:', data.error);
      // Show error notification
    });

    // Group management events (enhanced to match web-app)
    chatSocketService.on('create-group-success', (data) => {
      console.log('Group created successfully:', data);
      loadConversations(); // Refresh conversation list
      setShowNewGroupModal(false);


      // Select the newly created group
       loadConversations().then(() => {
    // Tìm conversation mới tạo dựa vào groupName
        if (data.groupName) {
          const newConversation = conversations.find(
            conv => conv.groupName === data.groupName || conv.conversationName === data.groupName
          );
          if (newConversation) {
            setSelectedConversation(newConversation);
          }
        }
      });
    });

    chatSocketService.on('create-group-error', (data) => {
      console.error('Create group error:', data.error);
      // Show error notification
    });

    chatSocketService.on('add-participants-success', (data) => {
      console.log('Participants added:', data);
      
      // Update conversations list with new participants
      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              participants: data.participants
            };
          }
          return conv;
        })
      );

      // Update the selected conversation with new participants
      if (selectedConversation && selectedConversation.id === data.conversationId) {
        setSelectedConversation(prevConversation => ({
          ...prevConversation,
          participants: data.participants
        }));
      }
      loadMessages(data.conversationId);

    });

    chatSocketService.on('add-participants-error', (data) => {
      console.error('Add participants error:', data.error);
    });

    chatSocketService.on('remove-participants-success', (data) => {
      console.log('Participants removed:', data);
      
      // Update conversations list to reflect the change
      if (selectedConversation && selectedConversation.id === data.conversationId) {
        setSelectedConversation(prevConversation => ({
          ...prevConversation,
          participants: prevConversation.participants?.filter(
            participant => !data.removedParticipantIds?.includes(participant.userId)
          ) || []
        }));
      }

      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              participants: conv.participants?.filter(
                participant => !data.removedParticipantIds?.includes(participant.userId)
              ) || []
            };
          }
          return conv;
        })
      );

      loadMessages(data.conversationId);
    });

    chatSocketService.on('remove-participants-error', (data) => {
      console.error('Remove participants error:', data.error);
    });

    chatSocketService.on('leave-group-success', (data) => {
      console.log('Left group successfully:', data);
      
      // Remove the conversation from the list when user leaves
      setConversations(prevConversations =>
        prevConversations.filter(conv => conv.id !== data.conversationId)
      );

      // Clear selected conversation if it was the one the user left
      if (selectedConversation && selectedConversation.id === data.conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    });

    chatSocketService.on('leave-group-error', (data) => {
      console.error('Leave group error:', data.error);
    });

    chatSocketService.on('group-info-edit-success', (data) => {
      console.log('Group info edited successfully:', data);
      
      // Update conversations list with new group info
      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.id === data.id) {
            return {
              ...conv,
              groupName: data.groupName,
              conversationName: data.groupName,
              groupAvatar: data.groupAvatar,
              conversationAvatar: data.groupAvatar,
              updatedAt: data.updatedAt
            };
          }
          return conv;
        })
      );

      // Update selected conversation if it's the same one
      if (selectedConversation && selectedConversation.id === data.id) {
        setSelectedConversation(prevConversation => ({
          ...prevConversation,
          groupName: data.groupName,
          conversationName: data.groupName,
          groupAvatar: data.groupAvatar,
          conversationAvatar: data.groupAvatar,
          updatedAt: data.updatedAt
        }));
      }
      loadMessages(data.id);
    });

    chatSocketService.on('group-info-edit-error', (data) => {
      console.error('Group info edit error:', data.error);
    });

    // Enhanced error events
    chatSocketService.on('reply-message-error', (data) => {
      console.error('Reply error:', data.error);
      // Show error notification
    });

    // ✅ Reaction update - system messages for reactions will be handled by handleIncomingMessage
    chatSocketService.on('reaction-update', (data) => {
      console.log('Reaction update received:', data);
      handleReactionUpdate(data);
      // System message for reactions will be handled by handleIncomingMessage
      // No need to manually increment unreadCount here
    });

    chatSocketService.on('react-message-success', (data) => {
      console.log('Reaction added successfully:', data);
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        updateMessageInList(data);
        
        // Clear the reacting flag
        if (data.emoji) {
          const reactionKey = `${data.id}-${data.emoji}`;
          setReactingToMessage(prev => {
            const next = new Set(prev);
            next.delete(reactionKey);
            return next;
          });
        }
      }
    });

    chatSocketService.on('remove-reaction-success', (data) => {
      console.log('Reaction removed successfully:', data);
      if (selectedConversation && data.conversationId === selectedConversation.id) {
        updateMessageInList(data);
      }
    });

    // Reaction error events
    chatSocketService.on('react-message-error', (data) => {
      console.error('React error:', data.error);
      // Show error notification
    });

    chatSocketService.on('remove-reaction-error', (data) => {
      console.error('Remove reaction error:', data.error);
      // Show error notification
    });

    chatSocketService.on('recall-message-success', (data) => {
      console.log('Message recalled:', data);
      updateMessageInList(data);
    });

    chatSocketService.on('recall-message-error', (data) => {
      console.error('Recall error:', data.error);
      // Show error notification
    });

    chatSocketService.on('forward-message-success', (data) => {
      console.log('Message forwarded successfully:', data);
      // Add forwarded message to target conversation
      if (selectedConversation && data.toConversationId === selectedConversation.id) {
        setMessages(prev => [...prev, data]);
      }
      // Update conversation list
      loadConversations();
    });

    chatSocketService.on('forward-message-error', (data) => {
      console.error('Forward message error:', data.error);
      // Show error notification
    });

    chatSocketService.on('edit-message-success', (data) => {
      console.log('Message edited successfully:', data);
      updateMessageInList(data);
    });

    chatSocketService.on('edit-message-error', (data) => {
      console.error('Edit message error:', data.error);
      // Show error notification
    });
  };
  
  // Enhanced incoming message handler (similar to web-app)
  const handleIncomingMessage = (messageData) => {
    console.log('Processing incoming message:', messageData);
    
    if (messageData.type === "SYSTEM_ADD_MEMBERS") {
      // User was added to a new group - refresh conversation list
      const currentUserId = user?.userId || user?.id;
      const existingConversation = conversations.find(conv => conv.id === messageData.conversationId);

      if (!existingConversation) {
        console.log("User was added to a new group, refreshing conversations...");
        loadConversations();
      }
    }

    if (messageData.type === "SYSTEM_REMOVE_MEMBERS") {
      const currentUserId = user?.userId || user?.id;
      
      // Check if current user was removed
      if (messageData.message && messageData.message.includes("You were removed from")) {
        console.log("User was removed from a group, refreshing conversations...");
        loadConversations();
        
        // Clear selection if this was the selected conversation
        if (selectedConversation && selectedConversation.id === messageData.conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        return;
      } else {
        // Other members were removed - refresh to update member counts
        loadConversations();
      }
    }

    if (messageData.type === "SYSTEM_LEAVE_GROUP") {
      const currentUserId = user?.userId || user?.id;
      
      // Check if current user left the group
      if (messageData.message && messageData.message.includes("You left")) {
        console.log("User left the group, refreshing conversations...");
        loadConversations();
        
        // Clear selection if this was the selected conversation
        if (selectedConversation && selectedConversation.id === messageData.conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        return;
      } else {
        // Another member left - update immediately
        loadConversations();
      }
    }

    if (selectedConversation && messageData.conversationId === selectedConversation.id) {
      setMessages(prev => {
        // ✅ XÓA TEMP MESSAGE CÓ CÙNG CONTENT VÀ THỜI GIAN GẦN NHAU
        const withoutTemp = prev.filter(msg => {
          if (msg.id.startsWith('temp-') && msg.message === messageData.message) {
            const timeDiff = Math.abs(
              new Date(messageData.createdDate) - new Date(msg.createdDate)
            );
            // Nếu thời gian chênh lệch < 5 giây, coi như là cùng 1 message
            if (timeDiff < 5000) {
              console.log('🗑️ Removing temp message:', msg.id);
              return false; // Remove temp message
            }
          }
          return true;
        });

        // Check if real message already exists
        const messageExists = withoutTemp.some(msg => msg.id === messageData.id);

        if (!messageExists) {
          const updatedMessages = [...withoutTemp, messageData].sort(
            (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
          );
          return updatedMessages;
        }

        console.log("Message already exists, not adding");
        return withoutTemp;
      });
    }

    // Update conversation list with new last message
    setConversations(prevConversations => {
      const isSystemMessage = messageData.type === 'SYSTEM' || messageData.type?.startsWith('SYSTEM_');
      const isCurrentUserAction = messageData.me === true;
      
      // Don't increment unreadCount for system messages from current user
      const shouldIncrementUnread = !(isSystemMessage && isCurrentUserAction);
      
      const updatedConversations = prevConversations.map(conv =>
        conv.id === messageData.conversationId
          ? {
              ...conv,
              lastMessage: messageData,
              lastTimestamp: new Date(messageData.createdDate).toLocaleString(),
              unreadCount: conv.id === selectedConversation?.id 
                ? 0 
                : shouldIncrementUnread 
                  ? (conv.unreadCount || 0) + 1 
                  : conv.unreadCount || 0,
              updatedAt: new Date().toISOString()
            }
          : conv
      );

      // Sort conversations by last message time (most recent first)
      return updatedConversations.sort((a, b) => {
        const dateA = new Date(a.lastMessage?.createdDate || a.updatedAt || a.createdAt);
        const dateB = new Date(b.lastMessage?.createdDate || b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
    });
    console.log("Message reload: " , messages);
  };

  // Legacy handler for backward compatibility
  const handleNewMessage = (messageData) => {
    console.log('Legacy handleNewMessage called:', messageData);
    handleIncomingMessage(messageData);
  };

  const handleMessageStatusUpdate = (data) => {
    console.log('Processing message status update:', data);
    
    if (selectedConversation && data.conversationId === selectedConversation.id) {
      setMessages(prev => {
        const updatedMessages = prev.map(msg => {
          // Update status for messages in the messageIds array
          if (data.messageIds?.includes(msg.id)) {
            return {
              ...msg,
              status: data.status || 'SEEN',
              readDate: data.readDate || msg.readDate,
              readers: data.readers || msg.readers
            };
          }
          return msg;
        });
        return updatedMessages;
      });

      // Update conversation's last message status if it's affected
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === data.conversationId && conv.lastMessage && data.messageIds?.includes(conv.lastMessage.id)) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                status: data.status || 'SEEN',
                readDate: data.readDate
              }
            };
          }
          return conv;
        });
      });
    }
  };

  const handleMessageRecalled = (data) => {
    updateMessageInList(data);
  };

  const handleMessagePinned = (data) => {
    updateMessageInList(data);
  };

  const handleReactionUpdate = (data) => {
    const currentUserId = user?.id;
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === data.messageId 
          ? { 
              ...msg, 
              reactions: data.reactions?.map(reaction => ({
                ...reaction,
                reactedByMe: reaction.users?.some(u => 
                  u.userId === currentUserId || u.id === currentUserId
                )
              })) || []
            }
          : msg
      )
    );
  };

  const updateMessageInList = (updatedMessage) => {
    console.log('Updating message in list:', updatedMessage.id, 'with reactions:', updatedMessage.reactions);
    const currentUserId = user?.id;
    
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === updatedMessage.id) {
          // Process reactions to set reactedByMe flag
          const processedMessage = {
            ...updatedMessage,
            reactions: updatedMessage.reactions?.map(reaction => ({
              ...reaction,
              reactedByMe: reaction.users?.some(u => 
                u.userId === currentUserId || u.id === currentUserId
              )
            })) || []
          };
          return processedMessage;
        }
        return msg;
      });
      console.log('Messages updated, message with reactions:', updated.find(m => m.id === updatedMessage.id)?.reactions);
      return updated;
    });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatApiService.getConversations();
      const conversations = response.result || [];
      console.log("Conversations: ", conversations);
      
      // Sort conversations by last message time (most recent first)
      const sortedConversations = conversations.sort((a, b) => {
        const dateA = new Date(a.lastMessage?.createdDate || a.updatedAt || a.createdAt);
        const dateB = new Date(b.lastMessage?.createdDate || b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
      
      setConversations(sortedConversations);
      return sortedConversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
      return [];
      // You might want to show an error notification here
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await chatApiService.getMessages(conversationId);
      // Sort messages by creation date (oldest first, newest last)
      const sortedMessages = (response.result || []).sort((a, b) => 
        new Date(a.createdDate) - new Date(b.createdDate)
      );
      
      // Debug: Check for SYSTEM_REACTION messages
      const systemReactionMessages = sortedMessages.filter(msg => msg.type === 'SYSTEM_REACTION');
      if (systemReactionMessages.length > 0) {
        console.log('Found SYSTEM_REACTION messages:', systemReactionMessages);
      }
      
      setMessages(sortedMessages);

      // console.log("Sorted msgs: ", sortedMessages);
      
      // Mark messages as read when loading
      if (chatSocketService.isSocketConnected()) {
        chatSocketService.updateMessageStatus(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const messageContent = newMessage.trim();
    
    const optimisticMessage = {
      id: tempId,
      conversationId: selectedConversation.id,
      message: messageContent,
      sender: {
        userId: user.userId || user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      },
      createdDate: new Date().toISOString(),
      status: 'SENDING',
      type: replyingTo ? 'REPLY' : 'TEXT',
      me: true,
      ...(replyingTo && { replyToMessage: replyingTo })
    };

    try {
      setSending(true);
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // ✅ CHỈ GỬI 1 LẦN - REPLY HOẶC NORMAL MESSAGE
      if (replyingTo) {
        const replyRequest = {
          conversationId: selectedConversation.id,
          message: messageContent,
          replyToMessageId: replyingTo.id
        };

        if (chatSocketService.isSocketConnected()) {
          chatSocketService.sendReplyMessage(replyRequest);
        } else {
          await chatApiService.sendMessage(replyRequest);
        }
        setReplyingTo(null);
      } else {
        // ✅ CHỈ GỬI NORMAL MESSAGE KHI KHÔNG CÓ REPLY
        const messageData = {
          conversationId: selectedConversation.id,
          message: messageContent
        };
        
        if (chatSocketService.isSocketConnected()) {
          chatSocketService.sendMessage(messageData);
        } else {
          await chatApiService.sendMessage(messageData);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  // Forward & Edit message handlers
  const handleForwardMessage = (messageId, toConversationId) => {
    if (chatSocketService.isSocketConnected()) {
      const request = {
        messageId,
        toConversationId,
        fromUserId: user?.userId || user?.id
      };
      chatSocketService.forwardMessage(request);
    }
  };
  const handleEditMessage = (messageId, newContent, conversationId) => {
    if (chatSocketService.isSocketConnected()) {
      const request = {
        messageId,
        message: newContent,
        conversationId
      };
      chatSocketService.editMessage(request);
    }
  };  
  
  const markMessagesAsRead = async (conversationId) => {
    try {
      // Mark messages as read using Socket.IO
      if (chatSocketService.isSocketConnected()) {
        chatSocketService.updateMessageStatus(conversationId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleClickConversation = (conversation) => {
    setSelectedConversation({
      ...conversation,
      unreadCount: 0
    });

    // ✅ Update trong danh sách conversations
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
    
    markMessagesAsRead(conversation.id);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Send typing indicator
    if (value.trim() && selectedConversation && chatSocketService.isSocketConnected()) {
      chatSocketService.sendTypingIndicator(selectedConversation.id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (chatSocketService.isSocketConnected()) {
          chatSocketService.sendStopTypingIndicator(selectedConversation.id);
        }
      }, 2000);
    } else if (!value.trim() && selectedConversation && chatSocketService.isSocketConnected()) {
      // Send stop typing when input is cleared
      chatSocketService.sendStopTypingIndicator(selectedConversation.id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedConversation) return;

    try {
      // First upload the file to get the URL (using existing API)
      const response = await chatApiService.uploadMedia(file, selectedConversation.id);
      console.log('File uploaded:', response);
      
      // If we have socket connection, send via Socket.IO for real-time delivery
      if (chatSocketService.isSocketConnected() && response.result) {
        const mediaRequest = {
          conversationId: selectedConversation.id,
          fileUrl: response.result.mediaUrl,
          fileName: response.result.fileName || file.name,
          fileType: response.result.mediaType || file.type,
          fileSize: response.result.fileSize || file.size,
          caption: '' // Can be enhanced to allow captions
        };

        // If replying to a message, add reply info
        if (replyingTo) {
          mediaRequest.replyToMessageId = replyingTo.id;
          chatSocketService.sendMediaReply(mediaRequest);
          setReplyingTo(null);
        } else {
          chatSocketService.sendMediaMessage(mediaRequest);
        }
      } else {
        // Fallback: refresh messages to show the uploaded file
        await loadMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      // Show error notification
    }
  };
    // console.log("User: ", user);

  const handleReactToMessage = (messageId, emoji) => {
    const message = messages.find(msg => msg.id === messageId);
    const existingReaction = message?.reactions?.find(r => r.emoji === emoji || r.icon === emoji);
    const hasReacted = existingReaction?.users?.some(u => 
      u.id === user.id || u.userId === user.id || u.userId === user.userId
    );
    
    if (hasReacted) {
      console.log('User already reacted with this emoji, ignoring');
      return;
    }
    // console.log("User: ", user);
    // ✅ OPTIMISTIC UPDATE - Cập nhật UI ngay lập tức
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = msg.reactions || [];
      const reactionIndex = reactions.findIndex(r => r.emoji === emoji || r.icon === emoji);
      
      if (reactionIndex >= 0) {
        // Reaction đã tồn tại, thêm user vào
        const updatedReactions = [...reactions];
        updatedReactions[reactionIndex] = {
          ...updatedReactions[reactionIndex],
          count: (updatedReactions[reactionIndex].count || 0) + 1,
          reactedByMe: true,
          users: [
            ...(updatedReactions[reactionIndex].users || []),
            { 
              id: user.id, 
              userId: user.id,
              fullName: user.name,
              avatar: user.avatar 
            }
          ]
        };
        return { ...msg, reactions: updatedReactions };
      } else {
        // Thêm reaction mới
        return {
          ...msg,
          reactions: [
            ...reactions,
            {
              emoji: emoji,
              icon: emoji,
              count: 1,
              users: [{
                id: user.id,
                userId: user.userId,
                fullName: user.name,
                avatar: user.avatar
              }],
              reactedByMe: true
            }
          ]
        };
      }
    }));

    console.log("Message after react:" ,messages);
    
    // Gửi request lên server
    chatSocketService.reactToMessage(messageId, emoji);
  };

  const handleRemoveReaction = (messageId, emoji) => {
    console.log('Remove reaction from message:', messageId, 'emoji:', emoji);

    // Optimistically update UI to remove the reaction
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = msg.reactions || [];
      const updatedReactions = reactions.map(reaction => {
        if (reaction.emoji === emoji || reaction.icon === emoji) {
          // Remove current user from the reaction
          const updatedUsers = reaction.users.filter(u => 
            u.id !== user.id && u.userId !== user.id && u.userId !== user.userId
          );
          
          return {
            ...reaction,
            count: Math.max(0, (reaction.count || 0) - 1),
            users: updatedUsers,
            reactedByMe: false
          };
        }
        return reaction;
      }).filter(reaction => reaction.count > 0); // Remove reactions with 0 count
      
      return { ...msg, reactions: updatedReactions };
    }));
    
    // Send to server
    chatSocketService.removeReaction(messageId, emoji);
  };

  const handleReactionClick = (message, reaction) => {
    // Check if current user has reacted with this emoji
    const hasReacted = reaction.users.some(u => 
      u.id === user.id || u.userId === user.id || u.userId === user.userId
    );
    
    setShowReactionDetails(message);
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    setShowMessageActions(null);
  };

  const handleRecallMessage = (messageId, recallType = 'self') => {
    if (chatSocketService.isSocketConnected()) {
      chatSocketService.recallMessage(messageId, recallType);
    }
    setShowMessageActions(null);
  };

  // Enhanced handlePinMessage with optimistic update
  const handlePinMessage = (messageId, pin) => {
    console.log(messageId, pin)
    if (chatSocketService.isSocketConnected()) {
      chatSocketService.pinMessage(messageId, pin);
    }
    
    // Optimistic UI update
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, pinned: pin } : msg
    ));
    
    setShowMessageActions(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Group management functions
  const handleAddParticipants = (conversationId, participantIds) => {
    if (chatSocketService.isSocketConnected()) {
      const request = {
        conversationId,
        participantIds
      };
      chatSocketService.addParticipants(request);
    }
  };

  const handleRemoveParticipants = (conversationId, participantIds) => {
    if (chatSocketService.isSocketConnected()) {
      const request = {
        conversationId,
        participantIds
      };
      chatSocketService.removeParticipants(request);
    }
  };

  const handleLeaveGroup = (conversationId) => {
    if (chatSocketService.isSocketConnected()) {
      const request = {
        conversationId
      };
      chatSocketService.leaveGroup(request);
    }
  };

  const handleDeleteMediaMessage = (messageId) => {
    if (chatSocketService.isSocketConnected()) {
      chatSocketService.deleteMediaMessage(messageId);
    }
  };

  const createNewGroup = async (groupName, selectedUsers) => {
    try {
      const groupData = {
        groupName: groupName.trim(),
        groupAvatar: null, // Can be enhanced later for avatar upload
        participantIds: selectedUsers
      };

      // Use Socket.IO for real-time group creation
      if (chatSocketService.isSocketConnected()) {
        chatSocketService.createGroupConversation(groupData);
        // Success/error will be handled by socket event listeners
      } else {
        // Fallback to API if socket not connected
        const apiGroupData = {
          type: 'GROUP',
          groupName,
          participants: selectedUsers.map(userId => ({ userId }))
        };
        const response = await chatApiService.createGroup(apiGroupData);
        console.log('Group created via API:', response);
        
        // Refresh conversations
        await loadConversations();
        setShowNewGroupModal(false);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      // Show error notification
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageStatusIcon = (status, me) => {
    if (!me) return null;
    
    return status === 'SEEN' ? (
      <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
    ) : (
      <CheckIcon className="h-4 w-4 text-gray-400" />
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.conversationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const EMOJI_LIST = [
  '👍', '❤️', '😊', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏',
  '🙏', '💯', '✨', '⭐', '👀', '🤔', '😎', '🥳', '💪', '🚀'
  ];

const EmojiPicker = ({ onSelect, onClose, position = 'bottom' }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64`}
    >
      <div className="grid grid-cols-5 gap-2">
        {EMOJI_LIST.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors hover:scale-110 transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

const ReactionDetailsModal = ({ message, reactions, onClose, onRemoveReaction, currentUserId }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Group all reactions by user
  const allReactions = reactions.flatMap(r => 
    r.users.map(user => ({
      emoji: r.icon,
      userId: user.userId || user.id,
      userName: user.fullName || 
               (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
               user.name || 
               'Unknown User'
    }))
  );

  // Get unique emojis
  const uniqueEmojis = ['All', ...new Set(reactions.map(r => r.emoji || r.icon))];
  const [selectedEmoji, setSelectedEmoji] = useState('All');

  const filteredReactions = selectedEmoji === 'All' 
    ? allReactions 
    : allReactions.filter(r => r.emoji || r.icon === selectedEmoji);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[70vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reactions</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Emoji Filter Tabs */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 overflow-x-auto">
          {uniqueEmojis.map((emoji, idx) => {
            const count = emoji === 'All' 
              ? allReactions.length 
              : reactions.find(r => (r.emoji || r.icon) === emoji)?.count || 0;
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedEmoji(emoji)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedEmoji === emoji
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {emoji !== 'All' && <span className="text-lg">{emoji}</span>}
                <span>{emoji === 'All' ? 'All' : ''}</span>
                <span className={`${selectedEmoji === emoji ? 'text-blue-100' : 'text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reactions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredReactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reactions yet
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReactions.map((reaction, idx) => {
                const currentUserIdValue = currentUserId?.userId || currentUserId?.id;
                const isCurrentUser = reaction.userId === currentUserIdValue;
                
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reaction.emoji}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {reaction.userName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">
                              (You)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {isCurrentUser && (
                      <button
                        onClick={() => {
                          onRemoveReaction(message.id, reaction.emoji);
                          onClose();
                        }}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  const pinnedMessages = messages.filter(m => m.isPinned 
    && !m.isRecalled
    && m.type != 'SYSTEM' 
    && m.type != 'SYSTEM_REACTION' 
    && m.type != 'SYSTEM_ADD_MEMBERS' 
    && m.type != 'SYSTEM_REMOVE_MEMBERS'
  );

  // Add scroll to message function
  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the message
      setHighlightedMessageId(messageId);
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };


  const filteredMessage = messages.filter(
    msg => msg.type !== "SYSTEM_REACTION"
  );

  return (
    <div className="w-full h-full flex bg-gray-50 overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col min-h-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 mr-2" />
              Messages
            </h1>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-full"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              onClick={() => handleClickConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {conversation.type === 'GROUP' ? (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-primary-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {conversation.conversationName.charAt(0)}
                      </span>
                    </div>
                  )}
                  {onlineUsers.has(conversation.participants.find(p => p.userId !== user.id)?.userId) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.conversationName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conversation.lastMessage && formatTime(conversation.lastMessage.createdDate)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`${conversation.unreadCount > 0 ? "font-bold": " " } text-sm text-gray-500 truncate`}>
                      {conversation.lastMessage.type !== "SYSTEM" ? (
                        <>
                          {/* Only show sender name for TEXT and FILE messages */}
                          {(conversation.lastMessage.type === 'TEXT' || conversation.lastMessage.type === 'FILE' || !conversation.lastMessage.type ) && 
                          conversation?.lastMessage?.sender?.userId === user?.id ? 'You: ' : (conversation?.lastMessage?.sender?.firstName + ": ")} 
                          {conversation.lastMessage.message}
                        </>
                      ) : (
                        conversation.lastMessage.message
                      )}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
       <div className="bg-white border-b border-gray-200 shadow-sm">
        {/* Main Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {selectedConversation?.type === 'GROUP' ? (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-lg">
                    {selectedConversation?.conversationName.charAt(0)}
                  </span>
                </div>
              )}
              {selectedConversation?.type !== 'GROUP' && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedConversation?.conversationName}
              </h3>
              <p className="text-sm text-gray-500 flex items-center">
                {selectedConversation?.type === 'GROUP' 
                  ? `${selectedConversation?.participants.length} members`
                  : <><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Online</>
                }
              </p>
            </div>
          </div>

            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setSearchMessages(searchMessages ? '' : 'search')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Search messages"
              >
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <Video className="h-5 w-5" />
              </button>
              <button 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick = {() => setShowConversationInfo(true)}
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Pinned Messages Section */}
          {pinnedMessages.length > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                  className="flex items-center space-x-2 text-sm text-amber-900 hover:text-amber-950 font-semibold transition-colors"
                >
                  <Pin className="h-4 w-4 fill-amber-600" />
                  <span>
                    {pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}
                  </span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${showPinnedMessages ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {showPinnedMessages && pinnedMessages.length > 0 && (
                  <button
                    onClick={() => {
                      // Unpin all messages
                      pinnedMessages.forEach(msg => handlePinMessage(msg.id, false));
                    }}
                    className="text-xs text-amber-700 hover:text-amber-900 font-medium px-2 py-1 hover:bg-amber-100 rounded transition-colors"
                  >
                    Unpin All
                  </button>
                )}
              </div>
              
              {showPinnedMessages && (
                <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                  {pinnedMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => scrollToMessage(msg.id)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-amber-800">
                              {msg.sender?.firstName} {msg.sender?.lastName}
                            </span>
                            <span className="text-xs text-amber-600">
                              {formatTime(msg.createdDate)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 hover:text-blue-600 transition-colors">
                            {msg.message}
                          </p>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinMessage(msg.id, false);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-amber-700 hover:bg-amber-100 rounded-full transition-all flex-shrink-0"
                          title="Unpin message"
                        >
                          <PinOff className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Bar */}
          {searchMessages && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search in conversation..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMessage.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(message.createdDate) !== formatDate(filteredMessage[index - 1].createdDate);
            
            const isSystemMessage = message.type !== 'TEXT' && message.type !== 'FILE' && message.type !== 'REPLY';
            // console.log("Messages: ", message);
            
            return (
              <div 
                key={message.id}
                ref={el => messageRefs.current[message.id] = el}
                className={`transition-all duration-300 ${
                  highlightedMessageId === message.id ? 'bg-yellow-100 rounded-lg p-2 -m-2' : ''
                }`}
              >
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-gray-200">
                      {formatDate(message.createdDate)}
                    </span>
                  </div>
                )}

                {isSystemMessage? (
                  <div className="flex justify-center">
                    <div className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-4 py-2 rounded-full max-w-md text-center">
                      <p className="font-medium">{message.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex ${message.me ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-md lg:max-w-lg xl:max-w-xl relative`}>
                      {!message.me && selectedConversation.type === 'GROUP' && (
                        <p className="text-xs font-medium text-gray-600 mb-1 px-3">
                          {message.sender?.firstName} {message.sender?.lastName}
                        </p>
                      )}
                      
                      <div className="relative">
                        {/* Message Bubble */}
                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${
                          message.me 
                            ? 'bg-blue-600 text-white rounded-br-md' 
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                        } ${message.pinned ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                          
                          {/* Pin Badge */}
                          {message.pinned && !message.isRecalled && (
                            <div className="absolute -top-1.5 -right-1.5 bg-amber-400 rounded-full p-1 shadow-sm">
                              <Pin className="h-3 w-3 text-amber-900" />
                            </div>
                          )}

                          {/* Reply Preview */}
                          {message.replyToMessage && !message.isRecalled && (
                            <div className={`mb-2 p-2 rounded-lg text-xs border-l-3 ${
                              message.me 
                                ? 'bg-blue-700/30 border-blue-300' 
                                : 'bg-gray-100 border-gray-400'
                            }`}>
                              <p className={`font-semibold ${message.me ? 'text-blue-100' : 'text-gray-700'}`}>
                                {message.replyToMessage.sender?.firstName}
                              </p>
                              <p className={`line-clamp-1 mt-0.5 ${message.me ? 'text-blue-200' : 'text-gray-600'}`}>
                                {message.replyToMessage.message}
                              </p>
                            </div>
                          )}

                          {/* Message Content */}
                          {message.isRecalled ? (
                            <div className={`italic text-sm flex items-center space-x-2 ${
                              message.me ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span>
                                {message.recallType === 'everyone' 
                                  ? 'This message was recalled' 
                                  : 'You recalled this message'}
                              </span>
                            </div>
                          ) : (
                            <>
                              {message.mediaType ? (
                                <div className="flex items-center space-x-2">
                                  {message.mediaType === 'image' ? (
                                    <Image className="h-5 w-5" />
                                  ) : (
                                    <File className="h-5 w-5" />
                                  )}
                                  <span className="text-sm font-medium">{message.fileName}</span>
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {message.message}
                                </p>
                              )}
                              
                              {message.edited && (
                                <span className={`text-xs italic mt-1 inline-block ${
                                  message.me ? 'text-blue-200' : 'text-gray-500'
                                }`}>
                                  (edited)
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Quick Reactions on Hover */}
                        {!message.isRecalled && (
                          <div className={`absolute top-0 ${
                            message.me ? '-left-2 -translate-x-full' : '-right-2 translate-x-full'
                          } opacity-0 group-hover:opacity-100 transition-all duration-200`}>
                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex items-center space-x-0.5">
                              {/* Emoji Picker Button */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                  title="React"
                                >
                                  <Smile className="h-4 w-4 text-gray-600" />
                                </button>
                                
                                {showEmojiPicker === message.id && (
                                  <EmojiPicker
                                    onSelect={(emoji) => handleReactToMessage(message.id, emoji)}
                                    onClose={() => setShowEmojiPicker(null)}
                                    position="top"
                                  />
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplyToMessage(message);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                title="Reply"
                              >
                                <CornerUpLeft className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMessageActions(showMessageActions === message.id ? null : message.id);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                title="More"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* More Actions Dropdown */}
                        {showMessageActions === message.id && !message.isRecalled && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute top-full ${
                              message.me ? 'right-0' : 'left-0'
                            } mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[200px] overflow-hidden`}
                          >
                            {message.me && (
                              <>
                                <button
                                  onClick={() => handleEditMessage(message)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3 transition-colors"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  <span>Edit Message</span>
                                </button>
                                <button
                                  onClick={() => handlePinMessage(message.id, !message.pinned)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3 transition-colors"
                                >
                                  {message.pinned ? (
                                    <PinOff className="h-4 w-4" />
                                  ): (
                                    <Pin className="h-4 w-4" />
                                  )}
                                  
                                  <span>{message.pinned ? 'Unpin' : 'Pin'} Message</span>
                                </button>
                              </>
                            )}
                            
                            <button
                              onClick={() => handleForwardMessage(message)}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3 transition-colors"
                            >
                              <CornerUpRight className="h-4 w-4" />
                              <span>Forward</span>
                            </button>
                            
                            {message.me && (
                              <>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  onClick={() => handleRecallMessage(message.id, 'self')}
                                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Recall for Me</span>
                                </button>
                                <button
                                  onClick={() => handleRecallMessage(message.id, 'everyone')}
                                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 flex items-center space-x-3 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Recall for Everyone</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                       {/* Reactions Display */}
                      {message.reactions && message.reactions.length > 0 && !message.isRecalled && (
                        <div className={`flex flex-wrap gap-1 mt-2 ${message.me ? 'justify-end' : 'justify-start'}`}>
                          {message.reactions.map((reaction, idx) => {
                            const hasReacted = reaction.users.some(u => u.userId === user.id);
                            
                            return (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactionClick(message, reaction);
                                }}
                                className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all hover:scale-105 ${
                                  hasReacted
                                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                } shadow-sm`}
                                title={hasReacted ? 'Click to remove your reaction' : 'Click to view reactions'}
                              >
                                <span className="text-base">{reaction.emoji || reaction.icon}</span>
                                <span className="font-semibold">{reaction.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp & Status */}
                      <div className={`flex items-center gap-1.5 mt-1 text-xs ${
                        message.me ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-gray-500">
                          {formatTime(message.createdDate)}
                        </span>
                        {getMessageStatusIcon(message.status, message.me)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Reaction Details Modal */}
        {showReactionDetails && (
          <ReactionDetailsModal
            message={showReactionDetails}
            reactions={showReactionDetails.reactions}
            onClose={() => setShowReactionDetails(null)}
            onRemoveReaction={handleRemoveReaction}
            currentUserId= {user}
          />
        )}

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200">
          {/* Reply/Edit Preview */}
          {(replyingTo || editingMessage) && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-semibold text-blue-900 flex items-center">
                  {editingMessage ? (
                    <>
                      <Edit3 className="h-4 w-4 mr-2 flex-shrink-0" />
                      Edit Message
                    </>
                  ) : (
                    <>
                      <CornerUpLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                      Replying to {replyingTo?.sender?.firstName}
                    </>
                  )}
                </p>
                <p className="text-sm text-blue-700 truncate mt-0.5">
                  {(editingMessage || replyingTo)?.message}
                </p>
              </div>
              <button
                onClick={editingMessage ? cancelEdit : cancelReply}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Input Controls */}
          <div className="p-4">
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 self-end"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              
              <div className="flex-1 relative">
                {/* Textarea */}
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !sending) {  // ✅ Check sending
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={sending}  // ✅ Disable khi đang gửi
                  placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none outline-none disabled:bg-gray-100"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              
              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}  // ✅ Disable khi đang gửi
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-all shadow-md disabled:shadow-none flex-shrink-0 self-end"
              >
                {sending ? (
                  <Loader className="h-5 w-5 animate-spin" />  // ✅ Show loading
                ) : editingMessage ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
   
    </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <NewGroupModal
          onClose={() => setShowNewGroupModal(false)}
          onCreate={createNewGroup}
        />
      )}

      {/* Conversation Info Sidebar */}
      {showConversationInfo && selectedConversation && (
        <ConversationInfo
          conversation={selectedConversation}
          onClose={() => setShowConversationInfo(false)}
          onAddParticipants={handleAddParticipants}
          onRemoveParticipants={handleRemoveParticipants}
          onLeaveGroup={handleLeaveGroup}
        />
      )}
    </div>
  );
};

// New Group Modal Component
const NewGroupModal = ({ onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers] = useState([
    { id: 'user1', name: 'John Doe', role: 'Developer' },
    { id: 'user2', name: 'Jane Smith', role: 'Designer' },
    { id: 'user3', name: 'Alice Johnson', role: 'Project Manager' },
    { id: 'user4', name: 'Bob Wilson', role: 'Team Lead' }
  ]);

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      onCreate(groupName.trim(), selectedUsers);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members
            </label>
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredUsers.map(user => (
                <label key={user.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.role}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

// Conversation Info Sidebar
const ConversationInfo = ({ conversation, onClose, onAddParticipants, onRemoveParticipants, onLeaveGroup }) => {
  const handleAddMembers = () => {
    // This would open a modal to select users to add
    // For now, just demonstrate the API call
    console.log('Add members functionality would be implemented here');
  };

  const handleLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      onLeaveGroup(conversation.id);
    }
  };

  const handleRemoveMember = (participantId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      onRemoveParticipants(conversation.id, [participantId]);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Conversation Info</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Conversation Details */}
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            {conversation.type === 'GROUP' ? (
              <UserGroupIcon className="h-10 w-10 text-primary-600" />
            ) : (
              <span className="text-2xl font-semibold text-primary-600">
                {conversation.conversationName.charAt(0)}
              </span>
            )}
          </div>
          <h4 className="text-lg font-medium text-gray-900">{conversation.conversationName}</h4>
          <p className="text-sm text-gray-500">
            {conversation.type === 'GROUP' 
              ? `${conversation.participants.length} members`
              : 'Direct message'
            }
          </p>
        </div>

        {/* Members */}
        <div>
          <h5 className="text-sm font-medium text-gray-900 mb-3">
            Members ({conversation.participants.length})
          </h5>
          <div className="space-y-2">
            {conversation.participants.map(participant => (
              <div key={participant.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {participant.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {participant.firstName + " " + participant.lastName || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-700">
                      {participant.positionTitle}
                    </p>
                  </div>
                </div>
                {conversation.type === 'GROUP' && conversation.createdBy !== participant.userId && (
                  <button
                    onClick={() => handleRemoveMember(participant.userId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {conversation.type === 'GROUP' && (
          <div className="space-y-2">
            <button 
              onClick={handleAddMembers}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add Members
            </button>
            <button 
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
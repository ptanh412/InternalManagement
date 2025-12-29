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
import { apiService } from '../../services/apiService';

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
  const [searchQuery, setSearchQuery] = useState(''); // Search input value
  const [searchResults, setSearchResults] = useState([]); // Matching message IDs
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0); // Current position in results
  const [editingMessage, setEditingMessage] = useState(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showReactionDetails, setShowReactionDetails] = useState(null);
  const [reactingToMessage, setReactingToMessage] = useState(new Set());
  const [uploadingFile, setUploadingFile] = useState(false); // ✅ Track file upload state

  const isUploadingRef = useRef(false); // ✅ Prevent double upload
  const sendingRef = useRef(false);


  const eventHandlersSetup = useRef(false);

  // Add these refs and states at the top of ChatPage component
  const messageRefs = useRef({});
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  
  // New states for All Users tab
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'users'
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Sử dụng useRef để lưu conversations mới nhất mà không gây re-render cho useEffect
  const conversationsRef = useRef(conversations);
  
  // Luôn cập nhật ref khi conversations thay đổi
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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
    if (activeTab === 'users' && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [activeTab]);

  // Search messages effect
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = messages
        .filter(msg => 
          !msg.isRecalled && 
          msg.message?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(msg => msg.id);
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      // Scroll to first result
      if (results.length > 0) {
        scrollToMessage(results[0]);
      }
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchQuery, messages]);

    // ✅ Cleanup khi unmount hoặc conversation change
  useEffect(() => {
    return () => {
      isUploadingRef.current = false;
      setUploadingFile(false);
    };
  }, [selectedConversation?.id]);

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
        // ✅ REMOVED: setupSocketEventHandlers() - already called in useEffect below
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

    // ✅ Cleanup ALL socket listeners khi unmount
    return () => {
      // Connection events
      chatSocketService.off('connected');
      chatSocketService.off('disconnected');
      chatSocketService.off('connection_error');

      // Message events
      chatSocketService.off('message');
      chatSocketService.off('reply-message');
      chatSocketService.off('message-status-update');
      chatSocketService.off('message-recalled');
      chatSocketService.off('message-pinned');
      chatSocketService.off('message-unpinned');
      chatSocketService.off('reply-message-error');

      // Pin/Unpin events
      chatSocketService.off('pin-message-success');
      chatSocketService.off('unpin-message-success');
      chatSocketService.off('pin-message-error');

      // Media events
      chatSocketService.off('media-message-success');
      chatSocketService.off('media-message-error');
      chatSocketService.off('media-reply-success');
      chatSocketService.off('media-reply-error');

      // Group management events
      chatSocketService.off('create-group-success');
      chatSocketService.off('create-group-error');
      chatSocketService.off('add-participants-success');
      chatSocketService.off('add-participants-error');
      chatSocketService.off('remove-participants-success');
      chatSocketService.off('remove-participants-error');
      chatSocketService.off('leave-group-success');
      chatSocketService.off('leave-group-error');
      chatSocketService.off('group-info-edit-success');
      chatSocketService.off('group-info-edit-error');

      // Reaction events
      chatSocketService.off('reaction-update');
      chatSocketService.off('react-message-success');
      chatSocketService.off('remove-reaction-success');
      chatSocketService.off('react-message-error');
      chatSocketService.off('remove-reaction-error');

      // Other events
      chatSocketService.off('recall-message-success');
      chatSocketService.off('recall-message-error');
      chatSocketService.off('forward-message-success');
      chatSocketService.off('forward-message-error');
      chatSocketService.off('edit-message-success');
      chatSocketService.off('edit-message-error');

      eventHandlersSetup.current = false;
    };
  }, [selectedConversation]);

  const setupSocketEventHandlers = () => {
    // ✅ Remove ALL existing listeners first to prevent duplicates
    chatSocketService.off('connected');
    chatSocketService.off('disconnected');
    chatSocketService.off('connection_error');
    chatSocketService.off('message');
    chatSocketService.off('reply-message');
    chatSocketService.off('message-status-update');
    chatSocketService.off('message-recalled');
    chatSocketService.off('message-pinned');
    chatSocketService.off('message-unpinned');
    chatSocketService.off('pin-message-success');
    chatSocketService.off('unpin-message-success');
    chatSocketService.off('pin-message-error');
    chatSocketService.off('media-message-success');
    chatSocketService.off('media-message-error');
    chatSocketService.off('media-reply-success');
    chatSocketService.off('media-reply-error');
    chatSocketService.off('create-group-success');
    chatSocketService.off('create-group-error');
    chatSocketService.off('add-participants-success');
    chatSocketService.off('add-participants-error');
    chatSocketService.off('remove-participants-success');
    chatSocketService.off('remove-participants-error');
    chatSocketService.off('leave-group-success');
    chatSocketService.off('leave-group-error');
    chatSocketService.off('group-info-edit-success');
    chatSocketService.off('group-info-edit-error');
    chatSocketService.off('reply-message-error');
    chatSocketService.off('reaction-update');
    chatSocketService.off('react-message-success');
    chatSocketService.off('remove-reaction-success');
    chatSocketService.off('react-message-error');
    chatSocketService.off('remove-reaction-error');
    chatSocketService.off('recall-message-success');
    chatSocketService.off('recall-message-error');
    chatSocketService.off('forward-message-success');
    chatSocketService.off('forward-message-error');
    chatSocketService.off('edit-message-success');
    chatSocketService.off('edit-message-error');

    // Connection events
    chatSocketService.on('connected', (data) => {
      // console.log('Chat connected:', data);
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
    chatSocketService.on("message", (messageData) => {
      console.log("✅ Received message:", messageData);
      console.log("📍 Current selectedConversation:", selectedConversation?.id);
      console.log("📍 Message conversationId:", messageData.conversationId);

      // ✅ Người nhận
      const currentConvs = conversationsRef.current;
      const conversationExists = currentConvs.some(conv => conv.id === messageData.conversationId);
      // conversationExists = false

      if (!conversationExists) {
        console.log("🆕 New conversation detected, reloading...");
        
        // 1. Load lại toàn bộ conversation list từ API
        loadConversations().then((updatedConversations) => {
          // 2. Tìm conversation mới
          const newConversation = updatedConversations.find(conv => 
            conv.id === messageData.conversationId
          );
          
          // 3. Update last message và unreadCount cho conversation mới
          if (newConversation) {
            setConversations(prev => prev.map(conv => 
              conv.id === messageData.conversationId 
                ? { 
                    ...conv, 
                    lastMessage: messageData, 
                    unreadCount: (conv.unreadCount || 0) + 1,
                    modifiedDate: new Date().toISOString() 
                  }
                : conv
            ).sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate)));
          }
        });
        
        return; // Exit early
      }
      
      updateConversationLastMessage(messageData);
      
      setMessages(prev => {
        console.log("🔍 setMessages callback executed! Current messages:", prev.length);
        const exists = prev.some(msg => msg.id === messageData.id);
        console.log("🔍 Message exists?", exists);
        
        if (exists) {
          console.log('🔄 Updating existing message:', messageData);
          return prev.map(msg => {
            if (msg.id === messageData.id) {
              return { ...msg, ...messageData };
            }
            return msg;
          });
        } else {
          console.log('➕ Adding new message:', messageData);
          console.log('➕ Condition check:', {
            hasSelectedConv: !!selectedConversation,
            matchesConv: messageData.conversationId === selectedConversation?.id
          });
          
          if (selectedConversation && messageData.conversationId === selectedConversation.id) {
            return [...prev, messageData];
          }
          return prev;
        }
      });
    });

    // ✅ Handle Edit Message Success
    chatSocketService.on('edit-message-success', (messageData) => {
      console.log('✅ Edit message success:', messageData);
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageData.id) {
          return {
            ...msg,
            message: messageData.message,
            type: messageData.type, // "EDITED"
            edited: true,
            modifiedDate: messageData.modifiedDate,
            // Preserve other fields
            pinned: messageData.pinned || msg.pinned,
            reactions: messageData.reactions || msg.reactions || [],
          };
        }
        return msg;
      }));

      // Update conversation last message if needed
      updateConversationLastMessage(messageData);
      
    });

    // ✅ Handle Edit Message Error
    chatSocketService.on('edit-message-error', (error) => {
      console.error('❌ Edit message error:', error);
    });

    chatSocketService.on('reply-message', (messageData) => {
      console.log('📩 Reply message received via Socket.IO:', messageData);
      console.log('📍 Current selectedConversation:', selectedConversation?.id);
      console.log('📍 Message conversationId:', messageData.conversationId);
      
      // Update conversation last message
      updateConversationLastMessage(messageData); 
      
      // ✅ Update messages state
      setMessages(prev => {
        console.log('📝 Current messages count:', prev.length);
        
        const exists = prev.some(msg => msg.id === messageData.id);
        console.log('🔍 Message exists?', exists);
        
        if (exists) {
          console.log('♻️ Updating existing message:', messageData.id);
          return prev.map(msg => {
            if (msg.id === messageData.id) {
              return {
                ...msg,
                ...messageData,
                pinned: messageData.pinned || msg.pinned,
                createdDate: messageData.createdDate || msg.createdDate || Date.now() / 1000,
                modifiedDate: messageData.modifiedDate || msg.modifiedDate || Date.now() / 1000,
                reactions: messageData.reactions?.map(reaction => ({
                  ...reaction,
                  reactedByMe: reaction.users?.some(u => u.id === user?.id)
                })) || msg.reactions || [],
              };
            }
            return msg;
          });
        } else {
          // ✅ CRITICAL: Check if message belongs to current conversation
          const belongsToCurrentConv = messageData.conversationId;
          console.log('🎯 Belongs to current conversation?', belongsToCurrentConv);
          
          if (belongsToCurrentConv) {
            console.log('✅ Adding new message:', messageData.id);
            const newMessages = [...prev, messageData];
            console.log('📊 New messages count:', newMessages.length);
            return newMessages;
          } else {
            console.log('⚠️ Message not for current conversation, skipping');
            return prev;
          }
        }
      });
      
      // ✅ Force scroll to bottom after adding message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    chatSocketService.on('message-status-update', (statusData) => {
      console.log('Message status update received:', statusData);
      handleMessageStatusUpdate(statusData);
    });

    chatSocketService.on('message-recalled', (data) => {
      handleMessageRecalled(data);
    });

    chatSocketService.on('message-pinned', (messageData) => {
      // handleMessagePinned(data);
      console.log('Message pinned event received:', messageData);
      updateConversationLastMessage(messageData); 
      setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageData.id);
          
          if (exists) {
              // --- LOGIC UPDATE (Inline trực tiếp để tránh gọi hàm setMessages khác) ---
              console.log('Updating existing message:', messageData.id);
              return prev.map(msg => {
                  if (msg.id === messageData.id) {
                      return {
                          ...msg,
                          ...messageData,
                          pinned: messageData.pinned || msg.pinned,
                          reactions: messageData.reactions?.map(reaction => ({
                              ...reaction,
                              reactedByMe: reaction.users?.some(u => u.id === user?.id)
                          })) || msg.reactions || [],
                      };
                  }
                  return msg;
              });
          } else {
              // --- LOGIC ADD NEW ---
              console.log('Adding new message:', messageData.id);
              if (selectedConversation && messageData.conversationId === selectedConversation.id) {
                  return [...prev, messageData];
              }
              return prev;
          }
      });
    });

    chatSocketService.on('message-unpinned', (messageData) => {
      // handleMessagePinned(data);
      console.log('Message unpinned event received:', messageData);
      updateConversationLastMessage(messageData); 
      setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageData.id);
          
          if (exists) {
              // --- LOGIC UPDATE (Inline trực tiếp để tránh gọi hàm setMessages khác) ---
              console.log('Updating existing message:', messageData.id);
              return prev.map(msg => {
                  if (msg.id === messageData.id) {
                      return {
                          ...msg,
                          ...messageData,
                          pinned: false,
                          reactions: messageData.reactions?.map(reaction => ({
                              ...reaction,
                              reactedByMe: reaction.users?.some(u => u.id === user?.id)
                          })) || msg.reactions || [],
                      };
                  }
                  return msg;
              });
          } else {
              // --- LOGIC ADD NEW ---
              console.log('Adding new message:', messageData.id);
              if (selectedConversation && messageData.conversationId === selectedConversation.id) {
                  return [...prev, messageData];
              }
              return prev;
          }
      });
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
      console.log('📁 Media message sent successfully:', data);
      setUploadingFile(false);
      isUploadingRef.current = false; // ✅ Reset ref

      if (selectedConversation && data.conversationId === selectedConversation.id) {
        setMessages(prev => {
          const withoutTemp = prev.filter(msg => !msg.id.startsWith('temp-media-'));
          const messageExists = withoutTemp.some(msg => msg.id === data.id);
          
          if (!messageExists) {
            return [...withoutTemp, data].sort(
              (a, b) => {
                const timeA = a.createdDate < 10000000000 ? a.createdDate * 1000 : a.createdDate;
                const timeB = b.createdDate < 10000000000 ? b.createdDate * 1000 : b.createdDate;
                return timeA - timeB;
              }
            );
          }
          return withoutTemp;
        });
      }

      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId 
            ? { ...conv, updatedAt: new Date().toISOString() }
            : conv
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    });

    chatSocketService.on('media-message-error', (data) => {
      console.error('📁 Media message error:', data);
      setUploadingFile(false);
      isUploadingRef.current = false; // ✅ Reset ref
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-media-')));
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
          if (conv.id === data.id) {
            console.log('Updating conversation participants for:', conv.id);
            return {
              ...conv,
              participants: data.participants
            };
          }

          return conv;
        })
      );

      // Update the selected conversation with new participants
      if (selectedConversation && selectedConversation.id === data.id) {
        setSelectedConversation(prevConversation => ({
          ...prevConversation,
          participants: data.participants
        }));
      }
      // loadMessages(data.conversationId);

    });

    chatSocketService.on('add-participants-error', (data) => {
      console.error('Add participants error:', data.error);
    });

    chatSocketService.on('remove-participants-success', (data) => {
      console.log('Participants removed:', data);
      
      // Update conversations list to reflect the change
      if (selectedConversation && selectedConversation.id === data.id) {
        setSelectedConversation(prevConversation => ({
          ...prevConversation,
          participants: prevConversation.participants?.filter(
            participant => !data.removedParticipantIds?.includes(participant.userId)
          ) || []
        }));
      }

      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.id === data.id) {
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
        prevConversations.filter(conv => conv.id !== data.id)
      );

      // Clear selected conversation if it was the one the user left
      if (selectedConversation && selectedConversation.id === data.id) {
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

    chatSocketService.on('message-recalled', (data) => {
      console.log('Message recalled event received:', data);
      
      // ✅ Truyền toàn bộ data object vì nó đã có đầy đủ thông tin
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

    // chatSocketService.on('edit-message-success', (messageData) => {
    //   console.log('Edit message via Socket.IO:', messageData);
    //   // handleIncomingMessage(messageData);
    //   // updateMessageInList(messageData);
    //   updateConversationLastMessage(messageData); 
    //   setMessages(prev => {
    //       const exists = prev.some(msg => msg.id === messageData.id);
          
    //       if (exists) {
    //           // --- LOGIC UPDATE (Inline trực tiếp để tránh gọi hàm setMessages khác) ---
    //           console.log('Updating existing message:', messageData.id);
    //           return prev.map(msg => {
    //               if (msg.id === messageData.id) {
    //                   return {
    //                       ...msg,
    //                       ...messageData,
    //                       pinned: messageData.pinned || msg.pinned,
    //                       reactions: messageData.reactions?.map(reaction => ({
    //                           ...reaction,
    //                           reactedByMe: reaction.users?.some(u => u.id === user?.id)
    //                       })) || msg.reactions || [],
    //                   };
    //               }
    //               return msg;
    //           });
    //       } else {
    //           // --- LOGIC ADD NEW ---
    //           console.log('Adding new message:', messageData.id);
    //           if (selectedConversation && messageData.conversationId === selectedConversation.id) {
    //               return [...prev, messageData];
    //           }
    //           return prev;
    //       }
    //   });
    // });

    chatSocketService.on('edit-message-error', (data) => {
      console.error('Edit message error:', data.error);
      // Show error notification
    });
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

  // ✅ Hàm update conversation's lastMessage
  const updateConversationLastMessage = (newMessageOrUpdate) => {
    console.log('Updating conversation lastMessage with:', newMessageOrUpdate);
    setConversations(prevConversations => {
        const updatedList = prevConversations.map(conv => {
            // 1. Bỏ qua nếu không đúng conversation
            if (conv.id !== newMessageOrUpdate.conversationId) return conv;

            // ✅ Check if this is the current user's message
            const isCurrentUserMessage = newMessageOrUpdate.me === true || 
                                        newMessageOrUpdate.sender?.userId === user?.id;

            // ✅ Check if conversation is currently selected
            const isConversationSelected = selectedConversation?.id === conv.id;

            const currentLastMsg = conv.lastMessage;
            const isSameMessage = currentLastMsg?.id === newMessageOrUpdate.id;

            console.log(`Updating conversation ${conv.id} lastMessage:`, {
                currentLastMsgId: currentLastMsg?.id,
                newMessageId: newMessageOrUpdate.id,
                isSameMessage
            });
            
            // So sánh thời gian để biết tin mới hay tin cũ (phòng trường hợp socket trả về tin cũ được update)
            const isNewerMessage = currentLastMsg;
            console.log(`Is newer message: ${isNewerMessage}`);

            // TRƯỜNG HỢP 1: Update đúng vào tin nhắn đang là lastMessage (VD: Recall, Reaction)
            if (isSameMessage) {
                console.log('🔄 Updating content of existing lastMessage');
                return {
                    ...conv,
                    lastMessage: {
                        ...currentLastMsg,
                        ...newMessageOrUpdate, // Merge data mới (ví dụ isRecalled)
                    },
                    // Không cần đổi updatedAt nếu chỉ là update nội dung
                };
            }

            // TRƯỜNG HỢP 2: Tin nhắn mới tinh (Thời gian mới hơn lastMessage hiện tại)
            if (isNewerMessage) {
                console.log('🆕 Setting new lastMessage');
                return {
                    ...conv,
                    lastMessage: newMessageOrUpdate,
                    lastTimestamp: newMessageOrUpdate.createdDate, // Cập nhật thời gian hiển thị
                    modifiedDate: new Date().toISOString(),
                    unreadCount: !isCurrentUserMessage && !isConversationSelected 
                    ? (conv.unreadCount || 0) + 1 
                    : conv.unreadCount || 0
                };
            }

            // TRƯỜNG HỢP 3: Tin nhắn cũ (không phải lastMessage) được update -> Không làm gì với lastMessage của conv
            return conv;
        });

       return updatedList.sort((a, b) => {
            // Nhân 1000 nếu dữ liệu là giây (float)
            const timeA = (a.lastMessage?.createdDate || a.lastMessage?.modifiedDate) * 1000;
            const timeB = (b.lastMessage?.createdDate || b.lastMessage?.modifiedDate) * 1000;
            
            const dateA = new Date(timeA);
            const dateB = new Date(timeB);
            
            return dateB - dateA;
        });
    });
  };

  // ✅ Cập nhật hàm updateMessageInList để cũng update conversation
  const updateMessageInList = (updatedMessage) => {
    console.log('Updating message in list - Full data:', updatedMessage.id);
    const currentUserId = user?.id || user?.userId;
    
    setMessages(prev => {
      const messageExists = prev.some(msg => msg.id === updatedMessage.id);
      
      // if (!messageExists) {
      //   console.warn('Message not found in list:', updatedMessage.id);
      //   return prev;
      // }
      
      const updated = prev.map(msg => {
        if (msg.id === updatedMessage.id) {
          // ✅ Merge toàn bộ data mới vào message cũ
          const processedMessage = {
            ...msg,
            ...updatedMessage,
            // ✅ Xử lý reactions nếu có
            reactions: updatedMessage.reactions?.map(reaction => ({
              ...reaction,
              reactedByMe: reaction.users?.some(u => 
                u.userId === currentUserId || u.id === currentUserId
              )
            })) || msg.reactions || [],
          };
          
          console.log('✅ Message updated successfully:', {
            id: processedMessage.id,
            isRecalled: processedMessage.isRecalled,
            message: processedMessage.message,
            recallType: processedMessage.recallType
          });
          
          return processedMessage;
        }
        return msg;
      });
      
      return updated;
    });
    
    // ✅ Cũng update conversation nếu đây là lastMessage
    updateConversationLastMessage(updatedMessage);
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

  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiService.getAllUsers({});
      const users = response.data?.result || response?.result || [];

      console.log('All users loaded:', users);
      
      // Filter out current user and map to include full name
      const filteredUsers = users
        .filter(u => u.id !== user?.id)
        .map(u => ({
          ...u,
          fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          displayName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Unknown User'
        }));
      
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading all users:', error);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await chatApiService.getMessages(conversationId);
      // Sort messages by creation date (oldest first, newest last)
      const sortedMessages = (response.result || []).sort((a, b) => 
        new Date(a.createdDate) - new Date(b.createdDate)
      );
  
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
    if (sendingRef.current) return;
    sendingRef.current = true;

    if (!newMessage.trim() || !selectedConversation) {
      sendingRef.current = false;
      return;
    }

    const messageContent = newMessage.trim();
    const currentReplyingTo = replyingTo;
    const currentEditingMessage = editingMessage;

    console.log("Sending message - Captured replyingTo:", currentReplyingTo);
    console.log("Editing message:", currentEditingMessage);

    try {
      setSending(true);

      // ✅ Handle temp conversation (new chat with user)
      if (selectedConversation.id.startsWith('temp-') && selectedConversation.recipientId) {
        const tempId = selectedConversation.id;
        const recipientId = selectedConversation.recipientId;
        
        // Send message with recipientId - backend will create conversation automatically
        await chatApiService.sendMessage({
          recipientId: recipientId,
          message: messageContent
        });
        
        // ✅ Remove temp conversation from list
        setConversations(prev => prev.filter(conv => conv.id !== tempId));
        
        // Reload conversations to get the newly created one
        const updatedConversations = await loadConversations();
        
        // Find the new conversation with this user
        const newConversation = updatedConversations.find(conv => 
          conv.type !== 'GROUP' && 
          conv.participants.some(p => p.userId === recipientId)
        );
        
        if (newConversation) {
          setSelectedConversation(newConversation);
          loadMessages(newConversation.id);
        }
      }
      // ✅ CASE 1: EDITING MESSAGE
      else if (currentEditingMessage) {
        if (chatSocketService.isSocketConnected()) {
          chatSocketService.editMessage({
            messageId: currentEditingMessage.id,
            message: messageContent,
            conversationId: selectedConversation.id
          });

          // Optimistic update
          setMessages(prev => prev.map(msg => 
            msg.id === currentEditingMessage.id 
              ? { ...msg, message: messageContent, type: 'EDITED', edited: true }
              : msg
          ));
        }
      }
      // ✅ CASE 2: REPLYING MESSAGE
      else if (currentReplyingTo) {
        if (chatSocketService.isSocketConnected()) {
          chatSocketService.sendReplyMessage({
            conversationId: selectedConversation.id,
            message: messageContent,
            replyToMessageId: currentReplyingTo.id
          });
        }
      }
      // ✅ CASE 3: NEW MESSAGE
      else {
        await chatApiService.sendMessage({
          conversationId: selectedConversation.id,
          message: messageContent
        });

        // ✅ Move conversation to top immediately for sender
        setConversations(prev => {
          const updated = prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, updatedAt: new Date().toISOString() } // Update timestamp
              : conv
          );
          // Sort by updatedAt to move current conversation to top
          return updated.sort((a, b) => 
            new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          );
        });
      }

      // ✅ Clear input AFTER successful send (for ALL cases)
      setNewMessage('');
      if (currentReplyingTo) setReplyingTo(null);
      if (currentEditingMessage) setEditingMessage(null);
      
      // ✅ Force reset textarea height
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = ''; // Force clear DOM value
          textarea.style.height = 'auto';
        }
      }, 0);

    } catch (error) {
      console.error("Error sending message:", error);
      
      // ✅ Restore message ONLY on error
      setNewMessage(messageContent);
      if (currentReplyingTo) setReplyingTo(currentReplyingTo);
      if (currentEditingMessage) setEditingMessage(currentEditingMessage);

    } finally {
      setSending(false);
      setTimeout(() => (sendingRef.current = false), 200);
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

  // ✅ Sửa lại handleEditMessage để set state edit
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.message); // Đưa nội dung vào input
    setShowMessageActions(null);
    
    // Focus vào textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 100);
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

  const handleClickUser = async (selectedUser) => {
    try {
      // Check if conversation already exists with this user
      const existingConversation = conversations.find(conv => 
        conv.type !== 'GROUP' && 
        conv.participants.some(p => p.userId === selectedUser.id)
      );

      if (existingConversation) {
        // Open existing conversation
        handleClickConversation(existingConversation);
        setActiveTab('conversations');
        setSearchTerm(''); // ✅ Clear search when switching to conversations
      } else {
        // Create temporary conversation (NOT saved to database yet)
        const newConv = {
          id: `temp-${Date.now()}`,
          type: 'DIRECT',
          conversationName: selectedUser.displayName,
          participants: [
            { userId: user.id, firstName: user.firstName, lastName: user.lastName },
            { userId: selectedUser.id, firstName: selectedUser.firstName, lastName: selectedUser.lastName }
          ],
          lastMessage: { message: 'Start a conversation...',type: 'SYSTEM', createdDate: new Date().toISOString() },
          unreadCount: 0,
          recipientId: selectedUser.id, // Store recipientId for creating conversation on first message
          isTemporary: true // Mark as temporary
        };
        
        // ✅ Add temp conversation to the list so it appears in sidebar
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv);
        setActiveTab('conversations');
        setSearchTerm(''); // ✅ Clear search when switching to conversations
        setMessages([]);
      }
    } catch (error) {
      console.error('Error handling user click:', error);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');

    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
    }
  };

  // ✅ Improved file upload handler with optimistic UI
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    
    // ✅ Critical checks
    if (!file || !selectedConversation || uploadingFile || isUploadingRef.current) {
      console.log('❌ Upload blocked:', { 
        hasFile: !!file, 
        hasConversation: !!selectedConversation,
        uploadingFile,
        isUploading: isUploadingRef.current 
      });
      event.target.value = ''; // Reset input
      return;
    }

    console.log('📁 Starting file upload:', file.name);
    
    // ✅ Set both state and ref to prevent double execution
    setUploadingFile(true);
    isUploadingRef.current = true;
    
    // ✅ Reset input immediately
    event.target.value = '';

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const response = await apiService.uploadFile(formData);

      if (!response.result || !response.result.url) {
        throw new Error('Invalid upload response');
      }

      const mediaRequest = {
        conversationId: selectedConversation.id,
        fileUrl: response.result.url,
        fileName: response.result.fileName || file.name,
        fileType: response.result.mediaType || file.type,
        fileSize: response.result.fileSize || file.size,
        caption: newMessage.trim() || null
      };

      console.log('📤 Sending media message:', mediaRequest);

      if (replyingTo) {
        mediaRequest.replyToMessageId = replyingTo.id;
        chatSocketService.sendMediaReply(mediaRequest);
        setReplyingTo(null);
      } else {
        chatSocketService.sendMediaMessage(mediaRequest);
      }

      if (newMessage.trim()) setNewMessage('');

    } catch (err) {
      console.error('❌ Upload error:', err);
      alert(`Failed to upload file: ${err.message}`);
    } finally {
      // ✅ Reset both state and ref
      setUploadingFile(false);
      isUploadingRef.current = false;
    }
  };


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
      // Optimistic UI update
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, pinned: pin } : msg
      ));
    }
    
    
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
    // Convert from seconds to milliseconds if needed
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    // Convert from seconds to milliseconds if needed
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);
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
       <div className='flex mr-3 items-center'>
        <div className='flex mr-1'>
          <CheckIcon className="h-3 w-3 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          <CheckIcon className="h-3 w-3 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
        </div>
        <p>Seen</p>
      </div>
    ) : (
      <div className='flex space-x-1 mr-3 items-center'>
        <CheckIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
        <p>Sent</p>
      </div>
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.conversationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants?.some(p => p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

const EMOJI_LIST = [
  '👍', '❤️', '😊', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏',
  '🙏', '💯', '✨', '⭐', '👀', '🤔', '😎', '🥳', '💪', '🚀'
];

const INITIAL_COUNT = 5;  

const EmojiPicker = ({ onSelect, onClose, position = 'bottom' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const displayedEmojis = isExpanded ? EMOJI_LIST : EMOJI_LIST.slice(0, INITIAL_COUNT);

  return (
    <div 
      ref={pickerRef}
      className={`absolute -left-24 z-50 bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-200 ease-in-out dark:bg-gray-800 dark:border-gray-700
        ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
        ${isExpanded ? 'w-72 p-3' : 'w-auto p-2'} 
      `}
    >
      {/* Container: Dùng Flex cho gọn hoặc Grid cho đầy đủ */}
      <div className={`${isExpanded ? 'grid grid-cols-5 gap-2' : 'flex gap-1 items-center'}`}>
        
        {/* Render danh sách Emoji */}
        {displayedEmojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="text-2xl hover:bg-gray-100 dark:bg-gray-800 rounded-lg p-1.5 transition-transform hover:scale-125 active:scale-95 leading-none"
            title={emoji}
          >
            {emoji}
          </button>
        ))}

        {/* Nút dấu cộng (+) để mở rộng */}
        {!isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-800 dark:text-gray-200 rounded-full p-2 ml-1 transition-colors border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 flex items-center justify-center w-9 h-9"
            title="More emojis"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[70vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reactions</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Emoji Filter Tabs */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {uniqueEmojis.map((emoji, idx) => {
            const count = emoji === 'All' 
              ? allReactions.length 
              : reactions.find(r => (r.emoji || r.icon) === emoji)?.count || 0;
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedEmoji(emoji)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap dark:bg-gray-700 ${
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
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
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:bg-gray-900 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reaction.emoji}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
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

  // Navigate search results
  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex]);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  const pinnedMessages = messages?.filter(m => m?.pinned 
    && !m?.isRecalled
    && m?.type !== 'SYSTEM' 
    && m?.type !== 'SYSTEM_REACTION' 
    && m?.type !== 'SYSTEM_ADD_MEMBERS' 
    && m?.type !== 'SYSTEM_REMOVE_MEMBERS'
  );  

  // console.log("Pinned msgs: ", pinnedMessages);

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
    msg => msg.type !== "SYSTEM_REACTION" && msg.type !== "SYSTEM_FILE"
  );

  // console.log("Filtered: ", filteredMessage);

  // Filter users based on search
  const filteredUsers = allUsers.filter(u =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.positionName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className={`${showConversationInfo ? 'w-1/4' : 'w-1/3'} bg-white border-r border-gray-200 flex flex-col min-h-0 dark:bg-gray-800 dark:border-gray-700`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
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

          {/* Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'conversations'
                  ? 'bg-primary-600 text-white '
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 inline-block mr-2" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <UserGroupIcon className="h-4 w-4 inline-block mr-2" />
              Users
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search users...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Conversations or Users List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden dark:bg-gray-900 dark:text-gray-300">
          {activeTab === 'conversations' ? (
            // Conversations List
            filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              onClick={() => handleClickConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                selectedConversation?.id === conversation.id ? 'bg-primary-50 border-primary-200 dark:border-primary-700 dark:bg-primary-900' : ''
              }`}
            >
              <div className="flex items-center space-x-3 ">
                <div className="relative">
                  {conversation.type === 'GROUP' ? (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center dark:bg-primary-900">
                      <UserGroupIcon className="h-6 w-6 text-primary-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center dark:bg-gray-700">
                      <span className="text-white font-semibold">
                        {conversation.conversationName?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  {onlineUsers.has(conversation.participants.find(p => p.userId !== user.id)?.userId) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {conversation.conversationName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {conversation.lastMessage && formatTime(conversation.lastMessage.createdDate)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`${conversation.unreadCount > 0 ? "font-bold": " " } text-sm text-gray-500 truncate`}>
                      {conversation.lastMessage ? (
                        conversation.lastMessage.type !== "SYSTEM" && conversation.lastMessage.type !== "SYSTEM_ADD_MEMBERS" ? (
                          <>
                            {/* Only show sender name for TEXT and FILE messages */}
                            {(conversation.lastMessage.type === 'TEXT' || conversation.lastMessage.type === 'SYSTEM_FILE' || !conversation.lastMessage.type ) && 
                            conversation?.lastMessage?.sender?.userId === user?.id ? 'You: ' : (conversation?.lastMessage?.sender?.firstName + ": ")} 
                            {conversation.lastMessage.message}
                          </>
                        ) : (
                          conversation.lastMessage.message
                        )
                      ) : (
                        'No messages yet'
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
          ))
          ) : (
            // Users List
            loadingUsers ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <UserGroupIcon className="h-12 w-12 mb-2 text-gray-400 dark:text-gray-500" />
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleClickUser(u)}
                  className="p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {u.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      {onlineUsers.has(u.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {u.displayName} - {u.positionTitle}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        {/* {u.positionTitle && (
                          <span className="truncate">{u.positionTitle}</span>
                        )}
                        {u.positionTitle && u.departmentName && (
                          <span>•</span>
                        )} */}
                        {u.departmentName && (
                          <span className="truncate">{u.departmentName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${showConversationInfo ? 'w-1' : 'w-2/3'}`}>
        {/* Chat Header */}
       <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedConversation?.conversationName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 flex items-center">
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
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
                title="Search messages"
              >
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors">
                <Phone className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors">
                <Video className="h-5 w-5" />
              </button>
              <button 
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
              onClick = {() => setShowConversationInfo(!showConversationInfo)}
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Pinned Messages Section */}
          {pinnedMessages.length > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200 dark:border-amber-700 dark:from-amber-800 dark:to-orange-800">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                  className="flex items-center space-x-2 text-sm text-amber-900 hover:text-amber-950 font-semibold transition-colors dark:text-amber-300 dark:hover:text-amber-100"
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
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 shadow-sm hover:shadow-md transition-all group"
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
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 hover:text-blue-600 transition-colors">
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
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-200 dark:bg-gray-800"
                  />
                </div>
                
                {/* Search Results Counter & Navigation */}
                {searchResults.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="whitespace-nowrap font-medium">
                      {currentSearchIndex + 1} / {searchResults.length}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigateSearch('prev')}
                        className="p-1.5 hover:bg-gray-200 dark:bg-gray-700 rounded transition-colors"
                        title="Previous result"
                      >
                        <ChevronDown className="h-4 w-4 rotate-180" />
                      </button>
                      <button
                        onClick={() => navigateSearch('next')}
                        className="p-1.5 hover:bg-gray-200 dark:bg-gray-700 rounded transition-colors"
                        title="Next result"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setSearchMessages('');
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-1.5 hover:bg-gray-200 dark:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400 dark:text-gray-500"
                  title="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-gray-900">
          {filteredMessage.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(message.createdDate) !== formatDate(filteredMessage[index - 1].createdDate);
            
            const isSystemMessage = message.type !== 'TEXT' && message.type !== 'FILE' && message.type !== 'REPLY' && message.type !== 'IMAGE' && message.type !== 'EDITED';
            console.log("Messages: ", message);

            // Check if this is the last message in a consecutive sequence from the same sender
            const nextMessage = filteredMessage[index + 1];
            const currentSenderId = message.sender?.userId || message.senderId;
            const nextSenderId = nextMessage?.sender?.userId || nextMessage?.senderId;
            
            // Message is "last in sequence" if:
            // 1. No next message (this is the last message overall)
            // 2. Next message is from a different sender
            // 3. Next message is a system message (break the sequence)
            const nextIsSystemMessage = nextMessage && (
              nextMessage.type !== 'TEXT' && 
              nextMessage.type !== 'FILE' && 
              nextMessage.type !== 'REPLY' && 
              nextMessage.type !== 'IMAGE' && 
              nextMessage.type !== 'EDITED'
            );
            
            const isLastInSequence = !nextMessage || 
                                     currentSenderId !== nextSenderId ||
                                     nextIsSystemMessage;
            
            // Check if this message is in search results
            const isSearchResult = searchResults.includes(message.id);
            const isCurrentSearchResult = searchResults[currentSearchIndex] === message.id;
            
            return (
              <div 
                key={message.id}
                ref={el => messageRefs.current[message.id] = el}
                className={`transition-all duration-300 ${
                  highlightedMessageId === message.id ? 'bg-yellow-100 rounded-lg p-2 -m-2' : ''
                } ${isCurrentSearchResult ? 'bg-blue-100 rounded-lg p-2 -m-2' : isSearchResult ? 'bg-yellow-50 rounded-lg p-2 -m-2' : ''}`}
              >
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                      {formatDate(message.createdDate || message.modifiedDate)}
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
                  // --- BẮT ĐẦU PHẦN CHỈNH SỬA ---
                  <div className={`flex ${message.me ? 'justify-end' : 'justify-start'} group mb-4`}>
                    
                    {/* Container chính: Giới hạn chiều rộng tối đa */}
                    <div className={`flex flex-col ${message.me ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] relative`}>
                      
                      {/* 1. Tên người gửi - Độc lập, không ảnh hưởng width của bubble */}
                      {!message.me && selectedConversation?.type === 'GROUP' && (
                        <div className="mb-1 ml-1">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            {message.sender?.firstName} {message.sender?.lastName}
                          </span>
                        </div>  
                      )}
                      
                      {/* 2. Khối bao quanh Bubble và các thành phần đi kèm (Reply, Actions) */}
                      <div className={`flex flex-col ${message.me ? 'items-end' : 'items-start'} w-fit max-w-full relative`}>
                        
                        {/* Reply Preview */}
                        {message.replyToMessage && !message.isRecalled && (
                          <div className={`mb-1 p-2 rounded-lg text-xs border-l-3 max-w-full w-fit cursor-pointer hover:opacity-90 transition-opacity ${
                            message.me 
                              ? 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300' 
                              : 'bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300'
                          }`}>
                            <p className="font-bold truncate mb-0.5">
                              {message.replyToMessage.sender?.firstName}
                            </p>
                            <p className="line-clamp-1 opacity-80 break-all">
                              {message.replyToMessage.message}
                            </p>
                          </div>
                        )}

                        {/* Message Bubble Wrapper - w-fit để ôm text */}
                        <div className="relative max-w-full w-fit group/bubble">
                          
                          {/* Main Bubble Content */}
                          <div className={`inline-block px-3 py-2 rounded-2xl shadow-sm overflow-hidden
                          max-w-[280px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[400px] ${
                            message.me 
                              ? `${message.type !== 'IMAGE' ? 'bg-blue-600 text-white rounded-br-md' : ''}` 
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                          } ${message.pinned ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                            
                            {/* Recalled Message State */}
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
                                {/* Text Content */}
                                {message.message && (
                                  <span className="text-sm break-all whitespace-pre-wrap block">                                    
                                    {message.message}
                                  </span>
                                )}
                                
                                {/* Edited Badge */}
                                {(message.type === 'EDITED' || message.edited) && (
                                  <span className={`text-[10px] ml-1 align-bottom italic ${message.me ? 'text-blue-200' : 'text-gray-400'}`}>
                                    (edited)
                                  </span>
                                )}

                                {/* 2. THỜI GIAN (Chỉ hiện ở tin cuối chuỗi) */}
                                {isLastInSequence && (
                                  <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                                    message.me 
                                      ? 'justify-end text-blue-100'   // Tin mình: Căn phải, chữ màu sáng
                                      : 'justify-start text-gray-400' // Tin bạn: Căn trái, chữ màu tối
                                  }`}>
                                    {/* Giờ:Phút */}
                                    <span>{formatTime(message.createdDate)}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Pin Badge - Absolute Position */}
                          {message.pinned && !message.isRecalled && (
                            <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-0.5 shadow-sm border border-white z-10">
                              <Pin className="h-2.5 w-2.5 text-amber-900" />
                            </div>
                          )}

                          {/* Quick Actions (Hover) - Absolute Position bên cạnh Bubble */}
                          {!message.isRecalled && (
                            <div className={`absolute top-0 bottom-0 flex items-center ${
                              message.me ? '-left-2 -translate-x-full' : '-right-2 translate-x-full'
                            } opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 px-2 z-20`}>
                              <div className="bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-100 dark:border-gray-700 p-1 flex items-center space-x-1 dark:text-gray-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-yellow-500 transition-colors"
                                >
                                  <Smile className="h-4 w-4" />
                                </button>
                                {showEmojiPicker === message.id && (
                                  <div className="absolute top-8 left-0 z-50">
                                    <EmojiPicker
                                      onSelect={(emoji) => handleReactToMessage(message.id, emoji)}
                                      onClose={() => setShowEmojiPicker(null)}
                                      position="bottom"
                                    />
                                  </div>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReplyToMessage(message);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors"
                                >
                                  <CornerUpLeft className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMessageActions(showMessageActions === message.id ? null : message.id);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-colors"
                                >
                                  <MoreVertical className="h-4 w-4" />
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
                              } mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[180px] overflow-hidden dark:bg-gray-800 dark:border-gray-700`}
                            >
                              {message.me && (
                                <>
                                  <button
                                    onClick={() => handleEditMessage(message)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2 dark:hover:bg-gray-700"
                                  >
                                    <Edit3 className="h-4 w-4" /> <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handlePinMessage(message.id, !message.pinned)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2 dark:hover:bg-gray-700"
                                  >
                                    <Pin className="h-4 w-4" /> <span>{message.pinned ? 'Unpin' : 'Pin'}</span>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleForwardMessage(message)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2 dark:hover:bg-gray-700"
                              >
                                <CornerUpRight className="h-4 w-4" /> <span>Forward</span>
                              </button>
                              {message.me && (
                                <>
                                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                  <button
                                    onClick={() => handleRecallMessage(message.id, 'everyone')}
                                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center space-x-2  dark:bg-gray-900 dark:hover:bg-gray-700"
                                  >
                                    <Trash2 className="h-4 w-4" /> <span>Recall</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Media Content - Nằm ngoài Bubble để hiển thị full */}
                        {message.mediaUrl && !message.isRecalled && (
                          <div className={`mt-1 ${message.me ? 'self-end' : 'self-start'}`}>
                            {(message.mediaType?.startsWith('image/') || message.type === 'IMAGE') ? (
                              <img 
                                src={message.mediaUrl} 
                                alt={message.fileName || 'Image'}
                                className="rounded-lg max-w-full w-auto max-h-64 object-cover shadow-sm cursor-pointer hover:opacity-95"
                                loading="lazy"
                              />
                            ) : message.mediaType?.startsWith('video/') ? (
                              <video 
                                src={message.mediaUrl} 
                                controls
                                className="rounded-lg max-w-full w-auto max-h-64 shadow-sm"
                              />
                            ) : message.fileName ? (
                              <a 
                                href={message.mediaUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow max-w-[280px] ${
                                  message.me ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'
                                }`}
                              >
                                <div className={`p-2 rounded-full ${message.me ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                  <Paperclip className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{message.fileName}</p>
                                  {message.fileSize && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                      {(message.fileSize / 1024).toFixed(2)} KB
                                    </p>
                                  )}
                                </div>
                              </a>
                            ) : null}
                          </div>
                        )}

                        {/* Reactions - Wrap fit content */}
                        {message.reactions && message.reactions.length > 0 && !message.isRecalled && (
                          <div className={`flex flex-wrap gap-1 mt-1.5 ${message.me ? 'justify-end' : 'justify-start'}`}>
                            {message.reactions.map((reaction, idx) => {
                              const hasReacted = reaction.users.some(u => u.userId === user.id);
                              return (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReactionClick(message, reaction);
                                  }}
                                  className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:scale-105 border ${
                                    hasReacted
                                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  } shadow-sm`}
                                >
                                  <span className="text-sm leading-none">{reaction.emoji || reaction.icon}</span>
                                  <span className="font-semibold">{reaction.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp & Status */}
                        {isLastInSequence && (
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${message.me ? 'justify-end text-gray-400' : 'justify-start text-gray-400'}`}>
                            {/* <span>{formatTime(message.createdDate)}</span> */}
                            
                            {/* Logic hiển thị icon status vẫn giữ nguyên (chỉ hiện ở tin nhắn cuối cùng của toàn bộ danh sách) */}
                            {message.me && index === filteredMessage.length - 1 && (
                              getMessageStatusIcon(message.status, true)
                            )}
                          </div>
                        )}

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
                    {editingMessage ? editingMessage.message : replyingTo?.message}
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
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                disabled={uploadingFile} // ✅ Disable khi đang upload

              />
              <button
                onClick={() => {
                  if (!uploadingFile && !isUploadingRef.current) {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={uploadingFile || sending}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors flex-shrink-0 self-end disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                {uploadingFile ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  key={editingMessage?.id || replyingTo?.id || 'new-message'} // ✅ Force re-render khi state thay đổi
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !sending && !uploadingFile) {
                      e.preventDefault();
                      e.stopPropagation();   // ⛔ STOP sự kiện không bubble tới button
                      sendMessage();
                    }
                    // ESC to cancel edit
                    if (e.key === 'Escape' && editingMessage) {
                      cancelEdit();
                    }
                  }}
                  disabled={sending || uploadingFile}
                  placeholder={
                    uploadingFile 
                      ? "Uploading file..." 
                      : editingMessage 
                        ? "Edit your message..." 
                        : "Type a message..."
                  }
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none outline-none disabled:bg-gray-100 dark:bg-gray-800"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />

                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={uploadingFile}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              
              {/* Send Button */}
              <button
                type="button"   // tránh form submit default
                onMouseDown={(e) => e.preventDefault()} // stop trigger click by Enter
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || uploadingFile}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-all shadow-md disabled:shadow-none flex-shrink-0 self-end"
                title={editingMessage ? "Update message" : "Send message"}
              >
                {sending ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : editingMessage ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
              
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
          currentUser={user}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Group</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Members
            </label>
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {filteredUsers.map(user => (
                <label key={user.id} className="flex items-center p-3 hover:bg-gray-50 dark:bg-gray-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{user.role}</p>
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

// Shared Media Section Component
const SharedMediaSection = ({ conversationId }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadSharedMedia();
  }, [conversationId]);

  const loadSharedMedia = async () => {
    try {
      setLoading(true);
      const response = await chatApiService.getMessages(conversationId);
      const messages = response.result || [];
      
      // Filter messages with images
      const mediaMessages = messages.filter(msg => 
        msg.mediaUrl && msg.mediaType?.startsWith('image/')
      );
      
      setMedia(mediaMessages);
    } catch (error) {
      console.error('Error loading shared media:', error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const displayedMedia = expanded ? media : media.slice(0, 6);

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-between">
        <span>Shared Media ({media.length})</span>
        {media.length > 6 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show less' : 'View all'}
          </button>
        )}
      </h5>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      ) : media.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center py-4">No media shared yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {displayedMedia.map((msg) => (
            <a
              key={msg.id}
              href={msg.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-80 transition-opacity"
            >
              <img
                src={msg.mediaUrl}
                alt={msg.fileName || 'Shared media'}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// Shared Files Section Component
const SharedFilesSection = ({ conversationId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadSharedFiles();
  }, [conversationId]);

  const loadSharedFiles = async () => {
    try {
      setLoading(true);
      const response = await chatApiService.getMessages(conversationId);
      const messages = response.result || [];
      
      // Filter messages with non-image files
      const fileMessages = messages.filter(msg => 
        msg.mediaUrl && 
        msg.fileName &&
        !msg.mediaType?.startsWith('image/') &&
        !msg.mediaType?.startsWith('video/')
      );
      
      setFiles(fileMessages);
    } catch (error) {
      console.error('Error loading shared files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'zip':
      case 'rar':
        return '🗜️';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const displayedFiles = expanded ? files : files.slice(0, 5);

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-between">
        <span>Shared Files ({files.length})</span>
        {files.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show less' : 'View all'}
          </button>
        )}
      </h5>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center py-4">No files shared yet</p>
      ) : (
        <div className="space-y-2">
          {displayedFiles.map((msg) => (
            <a
              key={msg.id}
              href={msg.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <span className="text-2xl flex-shrink-0">{getFileIcon(msg.fileName)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {msg.fileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {formatFileSize(msg.fileSize)}
                </p>
              </div>
              <svg className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// Conversation Info Sidebar
const ConversationInfo = ({ conversation, onClose, onAddParticipants, onRemoveParticipants, onLeaveGroup, currentUser }) => {
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  // Check if this is a project conversation
  const isProjectConversation = conversation.participantsHash?.startsWith('PROJECT_');
  
  
  // Check if current user has permission to manage members
  const canManageMembers = () => {
    if (!conversation.type === 'GROUP') return false;
    
    if (isProjectConversation) {
      // For project conversations, only PROJECT_MANAGER and TEAM_LEAD can manage
      const userRole = conversation.participants.find(
        participant => participant.roleName === currentUser.role && participant.userId === currentUser.id
      );

      return userRole.roleName === 'PROJECT_MANAGER' || userRole.roleName === 'TEAM_LEAD';
    }
    
    // For non-project group conversations, anyone can manage
    return true;
  };
  
  const handleAddMembers = () => {
    if (canManageMembers()) {
      setShowAddMembersModal(true);
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      onLeaveGroup(conversation.id);
    }
  };

  const handleRemoveMember = (participantId) => {
    if (!canManageMembers()) {
      alert('You do not have permission to remove members from this conversation.');
      return;
    }
    
    if (window.confirm('Are you sure you want to remove this member?')) {
      onRemoveParticipants(conversation.id, [participantId]);
    }
  };
  
  const handleConfirmAddMembers = (selectedUserIds) => {
    if (selectedUserIds && selectedUserIds.length > 0) {
      onAddParticipants(conversation.id, selectedUserIds);
      setShowAddMembersModal(false);
    }
  };

  return (
    <>
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conversation Info</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300">
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
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{conversation.conversationName}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {conversation.type === 'GROUP' 
                ? `${conversation.participants.length} members`
                : `${conversation.participants.find(p => p.userId !== currentUser.id)?.positionTitle || 'User'}`
              }
            </p>
            {isProjectConversation && (
              <p className="text-xs text-blue-600 mt-1">
                🔒 Project Conversation
              </p>
            )}
          </div>

          {/* Members */}
          {conversation.type === 'GROUP' && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Members ({conversation.participants.length})
              </h5>
              <div className="space-y-2">
                {conversation.participants.map(participant => (
                  <div key={participant.userId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {participant.fullName?.charAt(0) || participant.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {participant.firstName + " " + participant.lastName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {participant.positionTitle || participant.roleName}
                        </p>
                      </div>
                    </div>
                    {conversation.type === 'GROUP' && 
                    conversation.createdBy !== participant.userId && 
                    currentUser.id !== participant.userId && 
                    canManageMembers() && (
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
          )}

          {/* Shared Media Section */}
          <SharedMediaSection conversationId={conversation.id} />

          {/* Shared Files Section */}
          <SharedFilesSection conversationId={conversation.id} />

          {/* Actions */}
          {conversation.type === 'GROUP' && (
            <div className="space-y-2">
              {canManageMembers() ? (
                <button 
                  onClick={handleAddMembers}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Add Members
                </button>
              ) : (
                <div className="w-full px-4 py-2 text-xs text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {isProjectConversation 
                    ? 'Only Project Managers and Team Leads can add members'
                    : 'You cannot add members to this conversation'}
                </div>
              )}
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
      
      {/* Add Members Modal */}
      {showAddMembersModal && (
        <AddMembersModal
          conversation={conversation}
          onClose={() => setShowAddMembersModal(false)}
          onConfirm={handleConfirmAddMembers}
          currentParticipants={conversation.participants}
        />
      )}
    </>
  );
};

// Add Members Modal Component
const AddMembersModal = ({ conversation, onClose, onConfirm, currentParticipants }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      // Fetch all users from the API
      const response = await apiService.getAllUsers();
      const allUsers = response.result || [];
      // Filter out users who are already participants
      const currentParticipantIds = currentParticipants.map(p => p.userId);
      
      const filtered = allUsers.filter(user => !currentParticipantIds.includes(user.id) && user.roleName === 'EMPLOYEE');
      
      setAvailableUsers(filtered);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const role = (user.roleName || user.role?.name || '').toLowerCase();
    
    return fullName.includes(searchLower) || 
           username.includes(searchLower) || 
           email.includes(searchLower) ||
           role.includes(searchLower);
  });

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirm = () => {
    if (selectedUsers.length > 0) {
      onConfirm(selectedUsers);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Members</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search users by name, username, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Selected Users Count */}
          {selectedUsers.length > 0 && (
            <div className="text-sm text-primary-600 font-medium">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </div>
          )}

          {/* User List */}
          <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                {searchTerm ? 'No users found matching your search' : 'No users available to add'}
              </div>
            ) : (
              <div>
                {filteredUsers.map(user => (
                  <label 
                    key={user.id} 
                    className="flex items-center p-3 hover:bg-gray-50 dark:bg-gray-900 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        {user.email}
                      </p>
                      {(user.roleName || user.role?.name) && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {user.roleName || user.role?.name}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedUsers.length === 0}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
              selectedUsers.length > 0
                ? 'bg-primary-600 hover:bg-primary-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
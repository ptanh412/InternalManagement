import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { getToken } from "./localStorageService";

export const getMyConversations = async () => {
  return await httpClient.get(API.MY_CONVERSATIONS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const createConversation = async (data) => {
  return await httpClient.post(
    API.CREATE_CONVERSATION,
    {
      type: data.type,
      participantIds: data.participantIds,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const createGroupConversation = async (data) => {
  return await httpClient.post(
    `${API.CONVERSATIONS}/create-group`,
    {
      groupName: data.groupName,
      groupAvatar: data.groupAvatar,
      participantIds: data.participantIds,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const createMessage = async (data) => {
  return await httpClient.post(
    API.CREATE_MESSAGE,
    {
      conversationId: data.conversationId,
      message: data.message,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const getMessages = async (conversationId) => {
  console.log("Fetching messages for conversation:", conversationId);
  
  return await httpClient.get(`${API.GET_CONVERSATION_MESSAGES}?conversationId=${conversationId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const markMessagesAsRead = async (conversationId) => {
  return await httpClient.put(`${API.MARK_MESSAGES_AS_READ}?conversationId=${conversationId}`, {}, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};
// Forward message via socket
export const forwardMessage = ({ fromUserId, toConversationId, messageId, socket }) => {
  if (!socket) throw new Error('Socket not connected');
  socket.emit('forward-message', { fromUserId, toConversationId, messageId });
};
// Edit message via socket
export const editMessage = ({ conversationId, messageId, newMessage, socket }) => {
  if (!socket) throw new Error('Socket not connected');
  socket.emit('edit-message', { conversationId, messageId, message: newMessage });
};

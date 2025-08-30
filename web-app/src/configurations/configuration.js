export const CONFIG = {
  API_GATEWAY: "http://localhost:8888/api/v1",
};

export const API = {
  BASE_URL: "http://localhost:8888/api/v1",
  LOGIN: "/identity/auth/token",
  MY_INFO: "/profile/users/my-profile",
  MY_POST: "/post/my-posts",
  CREATE_POST: "/post/create",
  UPDATE_PROFILE: "/profile/users/my-profile",
  UPDATE_AVATAR: "/profile/users/avatar",
  SEARCH_USER: "/profile/users/search",
  MY_CONVERSATIONS: "/chat/conversations/my-conversations",
  CONVERSATIONS: "/chat/conversations",
  CREATE_CONVERSATION: "/chat/conversations/create",
  CREATE_MESSAGE: "/chat/messages/create",
  GET_CONVERSATION_MESSAGES: "/chat/messages",
  MARK_MESSAGES_AS_READ: "/chat/messages/mark-as-read",
  
  // Admin endpoints
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_GROUPS: "/admin/groups",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_HEALTH: "/admin/health",
};

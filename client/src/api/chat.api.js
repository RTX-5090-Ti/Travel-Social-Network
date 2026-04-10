import { api } from "./axios";

export const chatApi = {
  listConversations() {
    return api.get("/api/chat/conversations");
  },

  openDirectConversation(userId) {
    return api.post(`/api/chat/conversations/direct/${userId}`);
  },

  getMessages(conversationId, params = {}) {
    return api.get(`/api/chat/conversations/${conversationId}/messages`, {
      params,
    });
  },

  sendMessage(conversationId, payload) {
    return api.post(`/api/chat/conversations/${conversationId}/messages`, payload);
  },

  markConversationRead(conversationId) {
    return api.post(`/api/chat/conversations/${conversationId}/read`);
  },
};

import { api } from "./axios";

export const chatApi = {
  listConversations() {
    return api.get("/api/chat/conversations");
  },

  deleteSelectedConversations(conversationIds = []) {
    return api.post("/api/chat/conversations/delete-selected", {
      conversationIds,
    });
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

  sendGifMessage(conversationId, payload) {
    return api.post(`/api/chat/conversations/${conversationId}/messages/gif`, payload);
  },

  sendImageMessage(conversationId, payload) {
    return api.post(
      `/api/chat/conversations/${conversationId}/messages/image`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  markConversationRead(conversationId) {
    return api.post(`/api/chat/conversations/${conversationId}/read`);
  },
};

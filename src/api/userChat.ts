import request from "@/utils/axios";

export const getHistory = (receiver_id: number) => {
  return request.get(`/user_chat/get_chat_history/${receiver_id}`);
};

// ws.ts
export function createChatSocket(user_id: number) {
  return new WebSocket(`ws://localhost:8000/user_chat/ws/chat/${user_id}`);
}

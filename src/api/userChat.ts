import request from "@/utils/axios";

export const getHistory = (receiver_id: number) => {
  return request.get(`/user_chat/get_chat_history/${receiver_id}`);
};

// ws.ts
export function createChatSocket(user_id: number) {
  return new WebSocket(
    `ws://http://g8ae9cac.natappfree.cc/user_chat/ws/chat/${user_id}`,
  );
}

// 查询未读消息
export const getUnreadMessageList = () => {
  return request.get(`/user_chat/get_unread_messages`);
};

// 查询当前用户所有消息
export const getAllMessageList = () => {
  return request.get(`/user_chat/get_all_messages`);
};

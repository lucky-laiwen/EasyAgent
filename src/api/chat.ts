import request from "@/utils/axios";

type ChatSchemas = {
  page_size?: number;
  last_id?: number;
};

// 获取聊天记录
export function getChatRecords(params: ChatSchemas) {
  return request.get("/chat/get_chat_list", { params });
}

// 获取聊天内容
export function getChatContent(id: number) {
  return request.get(`/chat/get_chat_message/${id}`);
}

type SendMessageSchemas = {
  id: number;
  message: string;
};
// 创建聊天
export function createChat(data: SendMessageSchemas) {
  return request.post("/chat/create_chat", data);
}

// 更新聊天标题
export function updateChatTitle(data: SendMessageSchemas) {
  return request.post(`/chat/update_chat_title`, data);
}

// 删除聊天
export function deleteChat(chat_id: number) {
  return request.delete(`/chat/delete_chat/${chat_id}`);
}

// 被分享用户取消分享
export function unShareChat(chat_id: number) {
  return request.get(`/chat/cancel_share/${chat_id}`);
}

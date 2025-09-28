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

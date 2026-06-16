import request from "@/utils/axios";

// Types
export interface DocItem {
  id: number;
  kb_id: number;
  filename: string;
  file_type: string;
  chunk_count: number;
  status: "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface DocChunk {
  content: string;
  chunk_index: number;
}

export interface DocContent {
  doc_id: number;
  filename: string;
  file_type: string;
  chunk_count: number;
  chunks: DocChunk[];
}

export interface RagReference {
  doc_id: number;
  filename: string;
  chunk_index?: number;
  snippet?: string;
  file_type?: string;
}

export interface UploadDocResponse {
  id: number;
  filename: string;
  file_type: string;
  status: string;
}

// 1. 上传文档（全局，后端只有这一个上传接口）
export function uploadDoc(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<UploadDocResponse>("/knowledge/upload_doc", formData);
}

// 2. 获取全局文档列表
export function getGlobalDocList() {
  return request.get<DocItem[]>("/knowledge/get_doc_list");
}

// 3. 获取会话专属文档列表
export function getChatDocList(chatId: number) {
  return request.get<DocItem[]>(`/knowledge/get_chat_doc_list/${chatId}`);
}

// 4. 删除文档
export function deleteDoc(docId: number) {
  return request.delete<null>(`/knowledge/delete_doc/${docId}`);
}

// 5. 获取文档内容
export function getDocContent(docId: number) {
  return request.get<DocContent>(`/knowledge/get_doc_content/${docId}`);
}

// 6. 重试失败文档
export function retryDoc(docId: number) {
  return request.post<null>(`/knowledge/retry_doc/${docId}`);
}

import { create } from "zustand";

// 文本搜索项
export interface WebSearchItem {
  title: string;
  href: string;
  body: string;
}
// 图片搜索项
export interface WebSearchImagesSchema {
  height: number;
  image: string;
  source: string;
  thumbnail: string;
  title: string;
  url: string;
  width: number;
}
// 新闻搜索项
export interface WebSearchNewsSchema {
  body: string;
  date: string;
  image: string;
  source: string;
  title: string;
  url: string;
}

export interface WeatherSearchItem {
  date: string;
  high: string;
  low: string;
  ymd: string;
  week: string;
  sunrise: string;
  sunset: string;
  aqi: string;
  fx: string;
  fl: string;
  type: string;
  notice: string;
}

export interface ToolContentSchema {
  text: Array<WebSearchItem>;
  imgs: Array<WebSearchImagesSchema>;
  news: Array<WebSearchNewsSchema>;
}

// 工具调用结构
export interface ToolCall {
  id: number;
  tool_name: string;
  tool_content: ToolContentSchema | string | null | Array<WeatherSearchItem>;
  tool_input: string;
  status: number;
  created_at: string;
}

// PPT 幻灯片大纲
export interface PptSlideOutline {
  index: number;
  title: string;
  subtitle?: string;
  description: string;
  layout?: string;
  points?: string[];
  visualSuggestion?: string;
}

// 聊天消息结构
export interface ChatItem {
  id: number;
  sender: 0 | 1; // 0: 用户, 1: AI
  content: string;
  think_content?: string;
  tool_calls?: ToolCall[]; // 支持多个工具调用
  title?: string;
  type?: string;
  message_type?: "text" | "ppt";
  finished?: boolean;
  ppt_outline?: PptSlideOutline[];
  ppt_style?: {
    theme?: string;
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    subtextColor?: string;
    fontFamily?: string;
    titleStyle?: string;
    bodyStyle?: string;
    cardStyle?: string;
    backgroundCSS?: string;
  };
  ppt_slides?: Record<number, string>;
  ppt_slide_status?: Record<number, "loading" | "done" | "error">;
  rag_references?: Array<{
    doc_id: number;
    filename: string;
    chunk_index?: number;
    snippet?: string;
    file_type?: string;
  }>;
  attachments?: Array<{
    id: number;
    filename: string;
    file_type: string;
    file_size: number;
    file_url: string;
    text_content?: string | null;
  }>;
}

// 用户信息
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  avatar: string;
}

// 分享用户聊天
interface ChatShareSchema {
  id: number;
  chat_id: number;
  owner_id: number;
  permission: number;
  shared_to_id: number;
  created_at: string;
  title: string;
}
// 聊天信息
export interface UserChatSchema {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  status: number;
  created_at: string;
  updated_at: string;
  share_chat?: ChatShareSchema;
}

// 好友信息
export interface UserFriendSchema {
  id: number;
  status: number;
  created_at: string;
  friend: {
    id: number;
    name: string;
    avatar: string;
  };
}

// 系统信息
export interface SystemInfoSchema {
  id: number;
  user_id: number;
  title: string;
  content: string;
  is_read: number;
  created_at: string;
  source_id: number;
  action_type: number;
}

// 全局状态结构
interface StoreSchema {
  socket: WebSocket | null;
  messages: ChatItem[] | null;
  theme: "dark" | "light" | "system";
  actualTheme: "light" | "dark";
  user: User | null;
  loading: { visible: boolean };
  showLoading: () => void;
  hideLoading: () => void;
  userChat: UserChatSchema[] | [];
  systemInfo: SystemInfoSchema[] | [];
  userFriend: UserFriendSchema[] | [];
  chatOpen: boolean;
  unReadMsg: UserChatSchema[] | [];
  allChatMsg: UserChatSchema[] | [];
}

// Zustand store
export const useStore = create<StoreSchema>(() => ({
  socket: null,
  messages: [],
  userFriend: [],
  userChat: [],
  chatOpen: false,
  systemInfo: [],
  unReadMsg: [],
  allChatMsg: [],
  theme:
    (localStorage.getItem("theme") as "dark" | "light" | "system") ?? "system",

  actualTheme:
    localStorage.getItem("theme") === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : ((localStorage.getItem("theme") as "dark" | "light") ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")),

  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") as string)
    : null,
  loading: { visible: false },
  showLoading: () => useStore.setState({ loading: { visible: true } }),
  hideLoading: () => useStore.setState({ loading: { visible: false } }),
}));

// 设置用户信息
export function setUser(user: User | null) {
  useStore.setState({ user });
  localStorage.setItem("user", JSON.stringify(user));
}

// 添加聊天记录
export function addMessage(item: ChatItem) {
  const messages = useStore.getState().messages;
  useStore.setState({ messages: [...(messages || []), item] });
}

// 设置主题
export function setTheme(theme: "dark" | "light" | "system") {
  useStore.setState({ theme });
  localStorage.setItem("theme", theme);
}

// 设置真实主题
export function setActualTheme(theme: "dark" | "light") {
  useStore.setState({ actualTheme: theme });
}

// 更新聊天消息
export function updateMessage({
  id,
  content,
  finished,
  tool_obj,
  think_content,
  ppt_outline,
  ppt_style,
  ppt_slide_html,
  ppt_slide_index,
  ppt_slide_status,
  message_type,
  rag_references,
}: {
  id: number;
  content?: string;
  finished?: boolean;
  tool_obj?: ToolCall;
  think_content?: string;
  ppt_outline?: PptSlideOutline[];
  ppt_style?: ChatItem["ppt_style"];
  ppt_slide_html?: string;
  ppt_slide_index?: number;
  ppt_slide_status?: "loading" | "done" | "error";
  message_type?: "text" | "ppt";
  rag_references?: ChatItem["rag_references"];
}) {
  const messages = useStore.getState().messages?.map((item) => {
    if (item.id !== id) return item;

    // 处理 tool_calls：存在则合并，不存在则追加
    let newToolCalls = item.tool_calls;
    if (tool_obj !== undefined) {
      const exists = item.tool_calls?.some((tc) => tc.id === tool_obj.id);
      if (exists) {
        newToolCalls = item.tool_calls?.map((tc) =>
          tc.id === tool_obj.id ? { ...tc, ...tool_obj } : tc,
        );
      } else {
        newToolCalls = [...(item.tool_calls || []), tool_obj];
      }
    }

    // PPT slides 更新
    let newSlides = item.ppt_slides;
    let newSlideStatus = item.ppt_slide_status;
    if (ppt_slide_index !== undefined && ppt_slide_html !== undefined) {
      const existing = item.ppt_slides?.[ppt_slide_index] ?? "";
      newSlides = { ...(item.ppt_slides || {}), [ppt_slide_index]: existing + ppt_slide_html };
    }
    if (ppt_slide_index !== undefined && ppt_slide_status !== undefined) {
      newSlideStatus = { ...(item.ppt_slide_status || {}), [ppt_slide_index]: ppt_slide_status };
    }

    return {
      ...item,
      ...(content !== undefined && {
        content: (item.content || "") + content,
        think_content: think_content
          ? (item.think_content || "") + think_content
          : item.think_content,
      }),
      ...(finished !== undefined && { finished }),
      ...(ppt_outline !== undefined && { ppt_outline }),
      ...(ppt_style !== undefined && { ppt_style }),
      ...(message_type !== undefined && { message_type }),
      ...(rag_references !== undefined && { rag_references }),
      tool_calls: newToolCalls,
      ppt_slides: newSlides,
      ppt_slide_status: newSlideStatus,
    };
  });

  useStore.setState({ messages });
}

// 设置整个消息列表
export function setMessages(messages: ChatItem[] | null) {
  useStore.setState({ messages });
}

// 更新用户聊天
export function updateUserChat(chat: UserChatSchema[]) {
  useStore.setState({ userChat: chat });
}

// 开关聊天窗口
export function toggleChat(isOpen: boolean) {
  useStore.setState({ chatOpen: isOpen });
}

// 更新用户好友
export function updateUserFriend(friend: UserFriendSchema[]) {
  useStore.setState({
    userFriend: friend,
  });
}

// 更新未读消息
export function updateUnReadMsg(unReadMsg: UserChatSchema[]) {
  useStore.setState({
    unReadMsg: unReadMsg,
  });
}

// 更新所有消息
export function updateAllChatMsg(allChatMsg: UserChatSchema[]) {
  useStore.setState({
    allChatMsg: allChatMsg,
  });
}

export function updatedSocket(socket: WebSocket | null) {
  useStore.setState({ socket });
}

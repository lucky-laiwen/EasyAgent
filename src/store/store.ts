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

// 聊天消息结构
export interface ChatItem {
  id: number;
  sender: 0 | 1; // 0: 用户, 1: AI
  content: string;
  think_content?: string;
  tool_calls?: ToolCall[]; // 支持多个工具调用
  title?: string;
  type?: string;
  finished?: boolean;
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
  const message = useStore.getState().messages;
  message?.push(item);
  useStore.setState({ messages: message });
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
}: {
  id: number;
  content?: string;
  finished?: boolean;
  tool_obj?: ToolCall;
  think_content?: string;
}) {
  const message = useStore.getState().messages?.map((item) => {
    if (item.id === id) {
      // 内容更新
      if (content !== undefined) {
        if (think_content) {
          item.think_content = (item.think_content || "") + think_content;
        }
        if (content) {
          item.content = (item.content || "") + content;
        }
      }

      item.tool_calls?.map((toolCall) => {
        if (toolCall.id === tool_obj?.id) {
          toolCall.tool_content = tool_obj?.tool_content;
          toolCall.tool_input = tool_obj?.tool_input;
          toolCall.status = tool_obj?.status;
          toolCall.created_at = tool_obj?.created_at;
        } else {
          item.tool_calls?.push(tool_obj as ToolCall);
        }
      });

      // 是否结束
      if (finished !== undefined) {
        item.finished = finished;
      }
    }
    return item;
  });

  useStore.setState({ messages: message });
}

// 更新工具调用内容
export function updateToolCallContent({
  toolCallId,
  messageId,
  toolContent,
  status,
  toolInput,
}: {
  messageId: number;
  toolCallId: number;
  toolContent?: ToolContentSchema | string | null;
  status?: number;
  toolInput?: string;
}) {
  const messages = useStore.getState().messages?.map((item) => {
    if (item.id === messageId && item.tool_calls) {
      const toolCall = item.tool_calls.find((call) => call.id === toolCallId);
      if (toolCall) {
        if (toolContent !== undefined) {
          toolCall.tool_content =
            typeof toolContent === "string"
              ? toolContent
              : structuredClone(toolContent);
        }
        if (status) {
          toolCall.status = status;
        }
        if (toolInput) {
          toolCall.tool_input = toolInput;
        }
      }
    }
    return item;
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

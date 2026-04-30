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

// 聊天消息结构
export interface ChatItem {
  id: number;
  sender: 0 | 1; // 0: 用户, 1: AI
  content: string;
  think_content?: string;
  tool_content?: ToolContentSchema | string | null | Array<WeatherSearchItem>; // ✅ 支持字符串或数组
  tool_name?: string;
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
  tool_content,
  tool_name,
  think_content,
}: {
  id: number;
  content?: string;
  finished?: boolean;
  tool_content?: ToolContentSchema | string | null;
  tool_name?: string;
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

      if (tool_name && !item.tool_name) {
        item.tool_name = tool_name;
      }

      // 工具内容更新 ✅ 支持数组或字符串
      if (tool_content) {
        if (typeof tool_content === "string") {
          // 是字符串就直接保存
          item.tool_content = tool_content;
        } else {
          // 是数组则深拷贝保存
          // item.tool_content = JSON.parse(JSON.stringify(tool_content));
          item.tool_content = structuredClone(tool_content);
        }
      }

      // 是否结束
      if (finished !== undefined) {
        item.finished = finished;
      }
    }
    return item;
  });

  useStore.setState({ messages: message });
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

import { create } from "zustand";

// 工具项
export interface WebSearchItem {
  title: string;
  href: string;
  body: string;
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
// 聊天消息结构
export interface ChatItem {
  id: number;
  sender: 0 | 1; // 0: 用户, 1: AI
  content: string;
  think_content?: string;
  tool_content?:
    | Array<WebSearchItem>
    | Array<WeatherSearchItem>
    | string
    | null; // ✅ 支持字符串或数组
  tool_name?: string;
  title?: string;
  type?: string;
  finished?: boolean;
}

// 用户信息
interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

// 全局状态结构
interface StoreSchema {
  messages: ChatItem[] | null;
  theme: "dark" | "light" | "system";
  actualTheme: "light" | "dark";
  user: User | null;
  loading: { visible: boolean };
  showLoading: () => void;
  hideLoading: () => void;
}

// Zustand store
export const useStore = create<StoreSchema>(() => ({
  messages: [],
  theme:
    (localStorage.getItem("theme") as "dark" | "light" | "system") ?? "system",

  actualTheme:
    localStorage.getItem("theme") === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : (localStorage.getItem("theme") as "dark" | "light") ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"),

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
  type,
  finished,
  tool_content,
  tool_name,
}: {
  id: number;
  content?: string;
  type?: string;
  finished?: boolean;
  tool_content?: Array<WebSearchItem> | string;
  tool_name?: string;
}) {
  const message = useStore.getState().messages?.map((item) => {
    if (item.id === id) {
      // 内容更新
      if (content !== undefined) {
        if (type === "think") {
          item.think_content = (item.think_content || "") + content;
        } else if (type === "text") {
          item.content = (item.content || "") + content;
        }
      }

      // 工具名更新
      if (type === "tool_name") {
        item.tool_name = tool_name;
      }

      // 工具内容更新 ✅ 支持数组或字符串
      if (type === "tool_content" && tool_content !== undefined) {
        if (typeof tool_content === "string") {
          // 是字符串就直接保存
          item.tool_content = tool_content;
        } else if (Array.isArray(tool_content)) {
          // 是数组则深拷贝保存
          item.tool_content = JSON.parse(JSON.stringify(tool_content));
        } else {
          item.tool_content = null;
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

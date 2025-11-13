import { create } from "zustand";
interface toolItem {
  title: string;
  href: string;
  body: string;
}

interface ChatItem {
  id: number;
  sender: 0 | 1; // 0: 用户, 1: AI
  content: string;
  think_content?: string;
  tool_content?: Array<toolItem>;
  tool_name?: string;
  title?: string;
  type?: string;
  finished?: boolean;
}
interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}
interface StoreSchema {
  messages: ChatItem[] | null; // 聊天记录
  theme: "dark" | "light" | "system"; // 主题
  user: User | null; // 用户信息
  loading: { visible: boolean }; // 全局加载
  showLoading: () => void;
  hideLoading: () => void;
}
export const useStore = create<StoreSchema>(() => ({
  messages: [],
  theme:
    localStorage.getItem("theme") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  user: null,
  loading: { visible: false }, // 全局加载
  showLoading: () =>
    useStore.setState({
      loading: { visible: true },
    }),
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
// 更新message
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
  tool_content?: Array<toolItem>;
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

      // 工具名更新（独立判断）
      if (type === "tool_name") {
        item.tool_name = tool_name;
      }

      // 工具内容更新
      if (type === "tool_content" && tool_content) {
        item.tool_content = JSON.parse(JSON.stringify(tool_content));
      }

      if (finished !== undefined) {
        item.finished = finished;
      }
    }
    return item;
  });

  useStore.setState({ messages: message });
}

// 设置messages
export function setMessages(messages: ChatItem[] | null) {
  useStore.setState({ messages });
}

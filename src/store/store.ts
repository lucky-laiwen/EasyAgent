import { create } from "zustand";
interface ChatItem {
  id: number;
  sender: 0 | 1; // 0: 用户, 1: AI
  content: string;
  think_content?: string;
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
}
export const useStore = create<StoreSchema>(() => ({
  messages: [],
  theme: window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light",
  user: null,
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
}: {
  id: number;
  content?: string;
  type?: string;
  finished?: boolean;
}) {
  const message = useStore.getState().messages?.map((item) => {
    if (item.id === id) {
      // 按需更新
      if (content !== undefined) {
        if (type === "think") {
          item.think_content = (item.think_content || "") + content;
        } else {
          item.content = (item.content || "") + content;
        }
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

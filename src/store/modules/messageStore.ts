// store/messageStore.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ChatItem {
  id: number;
  sender: 0 | 1; // 0: 用户, 1: AI
  content: string;
  think_content?: string;
  title?: string;
  type?: string;
  finished?: boolean;
}

interface MessageState {
  messages: ChatItem[];
}

const initialState: MessageState = {
  messages: [],
};

const messageStore = createSlice({
  name: "message",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatItem>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        id: number;
        content?: string;
        type?: string;
        finished?: boolean;
      }>
    ) => {
      const { id, content, type, finished } = action.payload;
      const msg = state.messages.find((m) => m.id === id);
      if (msg) {
        if (!finished) {
          if (type === "think") {
            msg.think_content = (msg.think_content || "") + content;
          } else {
            msg.content = (msg.content || "") + content;
          }
        }
        msg.finished = finished;
      }
    },

    resetMessages: (state) => {
      state.messages = [];
    },
    setMessages: (state, action: PayloadAction<ChatItem[]>) => {
      state.messages = action.payload;
    },
  },
});

export const { addMessage, updateMessage, resetMessages, setMessages } =
  messageStore.actions;
export default messageStore.reducer;

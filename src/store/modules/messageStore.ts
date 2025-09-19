import { createSlice } from "@reduxjs/toolkit";

// 定义 user 的类型（根据后端返回结构来改）
interface Detail {
  id: number;
  content: string;
  create_at: string;
  sender: number;
}
interface Message {
  message: Detail[];
}
const initialState: Message = {
  message: [],
};
const messageStore = createSlice({
  name: "message",
  initialState,
  reducers: {
    setMessage: (state, action) => {
      state.message = action.payload;
    },
  },
});

export const { setMessage } = messageStore.actions;
export default messageStore.reducer;

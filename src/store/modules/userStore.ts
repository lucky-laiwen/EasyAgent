import { createSlice } from "@reduxjs/toolkit";

// 定义 user 的类型（根据后端返回结构来改）
interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

let initialUser: User | null = null;

const storedUser = localStorage.getItem("user");
if (storedUser && storedUser !== "undefined") {
  try {
    initialUser = JSON.parse(storedUser) as User;
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
    initialUser = null;
  }
}

const userStore = createSlice({
  name: "user",
  initialState: {
    user: initialUser,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    clearUser: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const { setUser, clearUser } = userStore.actions;
export default userStore.reducer;

import request from "@/utils/axios";

// 获取好友列表
export function getFriendList() {
  return request.get("/user_friend/get_friend_list");
}

// 查询好友
export function searchFriend(params: { friend_name: string }) {
  return request.get("/user_friend/search_friend", { params });
}

// 添加好友
export function addFriend(params: { friend_id: number }) {
  return request.post("/user_friend/add_friend", params);
}

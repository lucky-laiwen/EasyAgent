import request from "@/utils/axios";

// 获取好友列表
export function getFriendList() {
  return request.get("/user_friend/get_friend_list");
}

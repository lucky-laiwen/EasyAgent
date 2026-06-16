import request from "@/utils/axios";
import type { User, UserFriendSchema } from "@/store/store";

interface SearchResult {
  mutual_friends: User[];
  non_mutual_friends: User[];
  pending_mutual_friends: User[];
}

// 获取好友列表
export function getFriendList() {
  return request.get<UserFriendSchema[]>("/user_friend/get_friend_list");
}

// 查询好友
export function searchFriend(params: { friend_name: string }) {
  return request.get<SearchResult>("/user_friend/search_friend", { params });
}

// 添加好友
export function addFriend(params: { friend_id: number }) {
  return request.post<UserFriendSchema>("/user_friend/add_friend", params);
}

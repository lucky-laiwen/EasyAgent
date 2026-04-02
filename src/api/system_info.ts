import request from "@/utils/axios";

// 查询系统消息
export const getSystemInfoList = () => {
  return request.get(`/system_info/get_system_messages`);
};

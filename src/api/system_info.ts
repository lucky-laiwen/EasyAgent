import request from "@/utils/axios";
import type { SystemInfoSchema } from "@/store/store";

// 查询系统消息
export const getSystemInfoList = () => {
  return request.get<SystemInfoSchema[]>(`/system_info/get_system_messages`);
};

import request from "@/utils/axios";
type LoginSchemas = {
  email: string;
  password: string;
};
// 用户登录
export const login = (params: LoginSchemas) => {
  return request.post("/user/login", params);
};

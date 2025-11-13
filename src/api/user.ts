import request from "@/utils/axios";
type LoginSchemas = {
  email: string;
  password: string;
};
// 用户登录
export const login = (params: LoginSchemas) => {
  return request.post("/user/login", params);
};

type RegisterSchemas = {
  email: string;
  password: string;
  name: string;
};
// 用户注册
export const register = (params: RegisterSchemas) => {
  return request.post("/user/create_user", params);
};

// 忘记密码
export const forgetPassword = (params: LoginSchemas) => {
  return request.post("/user/forget_password", params);
};

// 注销账户
export const logout = () => {
  return request.delete("/user/logout");
};

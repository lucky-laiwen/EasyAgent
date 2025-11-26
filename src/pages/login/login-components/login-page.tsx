import { Form, Input } from "antd";
import EAButton from "@/components/EAButton";
import { setUser, useStore } from "@/store/store";
import { login } from "@/api/user";
import EAMessage from "@/components/EAMessage";
type FieldType = {
  username?: string;
  password?: string;
};

import { useNavigate } from "react-router-dom";
import { useState } from "react";
const LoginPage = (props: {
  handleChange: (value: boolean) => void;
  handleForgotPassword: (value: boolean) => void;
}) => {
  const navigate = useNavigate();
  const { handleChange, handleForgotPassword } = props;
  const showLoading = useStore((store) => store.showLoading);
  const [loading, setIsLoading] = useState(false);
  const onFinish = async (values: FieldType) => {
    const { username, password } = values;
    setIsLoading(true);
    if (username && password) {
      const payload = {
        email: username,
        password: password,
      };
      const result = await login(payload);
      if (result.data.success) {
        showLoading();
        setTimeout(() => {
          setIsLoading(false);
          localStorage.setItem("token", result.data.data.access_token);
          setUser(result.data.data.user);
          navigate("/");
        }, 1000);
      } else {
        EAMessage.error(result.data.message);
        setIsLoading(false);
      }
    }
  };
  return (
    <>
      <div
        className={`px-[30px] flex flex-col justify-center items-center animate__animated w-[50%] animate__animated animate__fadeIn`}
      >
        <div className="text-[35px] font-bold text-center">
          Welcome EasyAgent
        </div>
        <span>Join now to start your AI-powered workspace.</span>
        <Form
          name="basic"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
          className={`!mt-[50px] w-[70%] flex flex-col justify-center `}
        >
          <div
            className="text-[var(--Ai-content-text)] text-[16px]"
            style={{ fontFamily: "'Playfair Display', sans-serif" }}
          >
            Account:
          </div>
          <Form.Item<FieldType>
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input autoComplete="off" className="!w-[100%]" />
          </Form.Item>
          <div
            className="text-[var(--Ai-content-text)] text-[16px] flex  justify-between"
            style={{ fontFamily: "'Playfair Display', sans-serif" }}
          >
            <span>Password:</span>
            <span
              className="cursor-pointer"
              onClick={() => {
                handleForgotPassword(true);
              }}
            >
              Forget password?
            </span>
          </div>
          <Form.Item<FieldType>
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <Form.Item label={null}>
            <EAButton
              loading={loading}
              text="Sign in"
              className="!w-[100%] rounded-[10px] !h-[40px]"
              style={{ fontFamily: "'Playfair Display', sans-serif" }}
              htmlType="submit"
            />
          </Form.Item>
          <EAButton
            text="Sign up"
            className="!w-[100%] rounded-[10px]"
            style={{ fontFamily: "'Playfair Display', sans-serif" }}
            onClick={() => handleChange(false)}
          />
        </Form>
      </div>
    </>
  );
};
export default LoginPage;

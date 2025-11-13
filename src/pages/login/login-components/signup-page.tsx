import { Form, Input } from "antd";
import EAButton from "@/components/EAButton";
import { setUser, useStore } from "@/store/store";
import { register } from "@/api/user";
type RegisterSchemas = {
  email: string;
  password: string;
  name: string;
};

import { useNavigate } from "react-router-dom";
const SignupPage = (props: { handleChange: (value: boolean) => void }) => {
  const navigate = useNavigate();
  const handleChange = props.handleChange;
  const showLoading = useStore((store) => store.showLoading);
  const onFinish = async (values: RegisterSchemas) => {
    if (values) {
      const payload = values;
      const result = await register(payload);
      if (result.data.success) {
        localStorage.setItem("token", result.data.data.access_token);
        setUser(result.data.data.user);
        showLoading();
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    }
  };
  return (
    <div
      className={`px-[30px] flex flex-col justify-center items-center animate__animated w-[50%] animate__animated animate__fadeIn`}
    >
      <div className="text-[35px] font-bold text-center">Sign EasyAgent</div>
      <span>Start building the future, one step at a time.</span>
      <Form
        name="basic"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        autoComplete="off"
        className={`!mt-[50px] w-[70%] flex flex-col justify-center `}
      >
        {/* name输入框 */}
        <div
          className="text-[var(--Ai-content-text)] text-[16px]"
          style={{ fontFamily: "'Playfair Display', sans-serif" }}
        >
          Name:
        </div>
        <Form.Item<RegisterSchemas>
          name="name"
          rules={[{ required: true, message: "Please input your name!" }]}
        >
          <Input autoComplete="off" className="!w-[100%]" />
        </Form.Item>
        {/* 邮箱输入框 */}
        <div
          className="text-[var(--Ai-content-text)] text-[16px]"
          style={{ fontFamily: "'Playfair Display', sans-serif" }}
        >
          Email:
        </div>
        <Form.Item<RegisterSchemas>
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input autoComplete="off" className="!w-[100%]" />
        </Form.Item>
        {/* 密码输入框 */}
        <div
          className="text-[var(--Ai-content-text)] text-[16px]"
          style={{ fontFamily: "'Playfair Display', sans-serif" }}
        >
          Password:
        </div>
        <Form.Item<RegisterSchemas>
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item label={null}>
          <EAButton
            text="Sign in"
            className="!w-[100%] rounded-[10px] !h-[40px]"
            style={{ fontFamily: "'Playfair Display', sans-serif" }}
            htmlType="submit"
          />
        </Form.Item>
        <EAButton
          text="Back login"
          className="!w-[100%] rounded-[10px]"
          style={{ fontFamily: "'Playfair Display', sans-serif" }}
          onClick={() => handleChange(true)}
        />
      </Form>
    </div>
  );
};
export default SignupPage;

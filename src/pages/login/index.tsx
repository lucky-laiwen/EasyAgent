import { Button, Form, Input } from "antd";
import { login } from "@/api/user";
import { useNavigate } from "react-router-dom";
import Logo from "@/assets/EasyAgent-Icon.svg";
import { setUser } from "@/store/store";
type FieldType = {
  username?: string;
  password?: string;
};

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values: FieldType) => {
    const { username, password } = values;

    if (username && password) {
      const payload = {
        email: username,
        password: password,
      };
      const result = await login(payload);
      if (result.data.success) {
        localStorage.setItem("token", result.data.data.access_token);
        setUser(result.data.data.user);
        navigate("/");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex  rounded-md w-[50%] shadow-lg pr-4">
        <img
          src={Logo}
          alt=""
          className="w-[50%] h-full rounded-tl-md rounded-bl-md"
        />

        <div className="px-[30px] bg-white/30 py-[50px] w-[50%]">
          <div className="text-[40px] font-bold text-center">
            欢迎登录 EasyAgent
          </div>
          <Form
            name="basic"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            autoComplete="off"
            className="!mt-[50px]"
          >
            <div>用户名：</div>
            <Form.Item<FieldType>
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input autoComplete="off" className="!w-full h" />
            </Form.Item>
            <div>密码：</div>
            <Form.Item<FieldType>
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <Form.Item label={null}>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;

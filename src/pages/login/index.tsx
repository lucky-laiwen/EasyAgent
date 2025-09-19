import { Button, Form, Input } from "antd";
import { login } from "@/api/user";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/modules/userStore";

type FieldType = {
  username?: string;
  password?: string;
};

const Login = () => {
  const dispatch = useDispatch(); // ✅ 获取 dispatch
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
        dispatch(setUser(result.data.data.user));
        navigate("/");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen gap-4 box">
      <div className="flex">
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label="username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item<FieldType>
            label="password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
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
  );
};

export default Login;

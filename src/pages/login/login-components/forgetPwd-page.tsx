import { Form, Input } from "antd";
import EAButton from "@/components/EAButton";
import { forgetPassword } from "@/api/user";

type FieldType = {
  email: string;
  password: string;
};

const ForgetPwdPage = (props: { handleChange: (value: boolean) => void }) => {
  const handleChange = props.handleChange;
  const onFinish = async (values: FieldType) => {
    const result = await forgetPassword(values);
    if (result.success) {
      handleChange(false);
    }
  };
  return (
    <div
      className={`px-[30px] flex flex-col justify-center items-center animate__animated w-[50%] animate__animated animate__fadeIn`}
    >
      <div className="text-[35px] font-bold text-center">Forget Password</div>
      <span>Enter your email to reset your password.</span>
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
          Email:
        </div>
        <Form.Item<FieldType>
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input autoComplete="off" className="!w-[100%]" />
        </Form.Item>
        <div
          className="text-[var(--Ai-content-text)] text-[16px]"
          style={{ fontFamily: "'Playfair Display', sans-serif" }}
        >
          Password:
        </div>
        <Form.Item<FieldType>
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item label={null}>
          <EAButton
            text="Reset Password"
            className="!w-[100%] rounded-[10px] !h-[40px]"
            style={{ fontFamily: "'Playfair Display', sans-serif" }}
            htmlType="submit"
          />
        </Form.Item>
        <EAButton
          text="Back Login"
          className="!w-[100%] rounded-[10px]"
          style={{ fontFamily: "'Playfair Display', sans-serif" }}
          onClick={() => handleChange(false)}
        />
      </Form>
    </div>
  );
};
export default ForgetPwdPage;

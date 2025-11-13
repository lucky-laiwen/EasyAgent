import loadingAnimation from "@/LootieJson/Welcome.json";
import { useStore } from "@/store/store";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import LoginPage from "./login-components/login-page";
import SignupPage from "./login-components/signup-page";
import ForgetPwdPage from "./login-components/forgetPwd-page";
const Login = () => {
  const hideLoading = useStore((store) => store.hideLoading);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgetPwd, setIsForgetPwd] = useState(false);
  useEffect(() => {
    hideLoading();
  }, [hideLoading]);

  return (
    <div
      className={`flex justify-center items-center h-screen`}
      style={{ fontFamily: "'Playfair Display', sans-serif" }}
    >
      <div className="flex bg-[var(--Ai-think-bg)]/80 rounded-[30px] w-[75%] h-[90%] shadow-lg pr-4 p-4 over-flow-hidden">
        {/* 登录动画区域 */}
        <div className="w-[50%] h-[100%] flex flex-col px-[5%] justify-between py-[5%] bg-[var(--login-bg)] !rounded-[20px]">
          <Lottie
            animationData={loadingAnimation}
            loop={true}
            className="mt-[20%]"
          />
          <div>
            <div className="text-[40px] mb-[20px]">
              Get <br /> Everything <br /> You Want
            </div>
            <span>
              You can accomplish anything when you stay focused and think smart.
              <br />
              Trust the process, follow the flow, and let intelligence lead the
              way.
            </span>
          </div>
        </div>

        {isForgetPwd ? (
          <ForgetPwdPage handleChange={setIsForgetPwd} />
        ) : isLogin ? (
          // 登录区域
          <LoginPage
            handleChange={setIsLogin}
            handleForgotPassword={setIsForgetPwd}
          />
        ) : (
          // 注册区域
          <SignupPage handleChange={setIsLogin} />
        )}
      </div>
    </div>
  );
};

export default Login;

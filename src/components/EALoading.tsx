import { useEffect, useState } from "react";
import "animate.css";
import { useStore } from "@/store/store";
import Lottie from "lottie-react";
import loadingAnimation from "@/LootieJson/Live chatbot.json";
interface EALoadingProps {
  visible: boolean;
}

const EALoading: React.FC<EALoadingProps> = ({ visible }) => {
  const [mounted, setMounted] = useState(visible);
  const [animatingOut, setAnimatingOut] = useState(false);
  const theme = useStore((state) => state.theme);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setAnimatingOut(false);
    } else if (mounted) {
      setAnimatingOut(true); // 触发退出动画
    }
  }, [visible, mounted]);

  const handleAnimationEnd = () => {
    if (animatingOut) {
      setMounted(false); // 动画结束后卸载
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 flex justify-center items-center bg-opacity-50 animate__animated ${
        animatingOut ? "animate__slideOutUp" : "animate__slideInDown"
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{
          width: "100%",
          height: "100%",
          background: theme === "dark" ? "rgb(29, 35, 42)" : "white",
        }}
      />
    </div>
  );
};

const GlobalLoading = () => {
  const loading = useStore((state) => state.loading);
  const theme = useStore((state) => state.theme);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = localStorage.getItem("theme");

    const activeTheme = storedTheme || theme;
    if (activeTheme === "system") {
      document.documentElement.setAttribute(
        "data-theme",
        mediaQuery.matches ? "dark" : "light"
      );
    } else {
      document.documentElement.setAttribute("data-theme", activeTheme);
    }
    const listener = (e: MediaQueryListEvent) => {
      const currentTheme = storedTheme || theme;
      if (currentTheme === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light"
        );
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  return (
    <>
      <EALoading visible={loading.visible} />
    </>
  );
};

export default GlobalLoading;

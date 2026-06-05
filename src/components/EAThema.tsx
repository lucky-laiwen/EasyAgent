import { useEffect } from "react";
import { useStore, setTheme, setActualTheme } from "@/store/store";
import EAButton from "./EAButton";
import { IconThemeSystem, IconMoon, IconSun } from "@/assets/icons";
const EATheme = () => {
  const theme = useStore((state) => state.theme);
  useEffect(() => {
    if (theme !== "system") {
      document.documentElement.setAttribute("data-theme", theme);
      setActualTheme(theme);
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applySystemTheme = () => {
      const isDark = media.matches;
      const newTheme = isDark ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      setActualTheme(newTheme);
    };

    applySystemTheme();
    media.addEventListener("change", applySystemTheme);

    return () => media.removeEventListener("change", applySystemTheme);
  }, [theme]);

  const toggleTheme = (res: "dark" | "light" | "system") => {
    setTheme(res);
    handleClose();
  };
  const handleClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };
  return (
    <div className="w-full">
      <div
        className="dropdown dropdown-right dropdown-center w-full"
        data-dropdown-offset="8"
      >
        <EAButton
          tableIndex={0}
          text={
            theme === "system"
              ? "跟随系统"
              : theme === "dark"
              ? "黑夜模式"
              : "日间模式"
          }
          className="flex w-full justify-start bg-[transparent] rounded-lg border-none shadow-none hover:bg-[var(--Ai-think-bg)]"
          icon={
            theme === "system" ? (
              <IconThemeSystem className="w-5 h-5" />
            ) : theme === "dark" ? (
              <IconMoon className="w-5 h-5" />
            ) : (
              <IconSun className="w-5 h-5" />
            )
          }
        />
        <ul
          tabIndex={-1}
          className=" dropdown-content ml-4 menu bg-base-100 rounded-box z-1 w-[50%] p-2 shadow-sm z-[9999]"
        >
          <li>
            <EAButton
              text="日间模式"
              icon={<IconSun className="w-[18px] h-[18px]" />}
              onClick={() => toggleTheme("light")}
              className="w-full p-2 bg-[transparent] border-none shadow-none rounded-lg  hover:bg-[var(--Ai-think-bg)]"
            />
          </li>
          <li>
            <EAButton
              text="黑夜模式"
              icon={<IconMoon className="w-[18px] h-[18px]" />}
              onClick={() => toggleTheme("dark")}
              className="flex w-full bg-[transparent] border-none shadow-none p-2 rounded-lg  hover:bg-[var(--Ai-think-bg)]"
            />
          </li>

          <li>
            <EAButton
              text="跟随系统"
              onClick={() => toggleTheme("system")}
              className=" w-full  p-2 bg-[transparent] border-none shadow-none rounded-lg  hover:bg-[var(--Ai-think-bg)]"
              icon={<IconThemeSystem className="w-[18px] h-[18px]" />}
            />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EATheme;

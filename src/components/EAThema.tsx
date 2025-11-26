import { useEffect } from "react";
import { useStore, setTheme, setActualTheme } from "@/store/store";
import EAButton from "./EAButton";
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6H8C6.89543 6 6 6.89543 6 8V18C6 19.1046 6.89543 20 8 20H18C19.1046 20 20 19.1046 20 18V8C20 6.89543 19.1046 6 18 6Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linejoin="round"
                />
                <path
                  d="M18 28H8C6.89543 28 6 28.8954 6 30V40C6 41.1046 6.89543 42 8 42H18C19.1046 42 20 41.1046 20 40V30C20 28.8954 19.1046 28 18 28Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linejoin="round"
                />
                <path
                  d="M35 20C38.866 20 42 16.866 42 13C42 9.13401 38.866 6 35 6C31.134 6 28 9.13401 28 13C28 16.866 31.134 20 35 20Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linejoin="round"
                />
                <path
                  d="M40 28H30C28.8954 28 28 28.8954 28 30V40C28 41.1046 28.8954 42 30 42H40C41.1046 42 42 41.1046 42 40V30C42 28.8954 41.1046 28 40 28Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linejoin="round"
                />
              </svg>
            ) : theme === "dark" ? (
              <svg
                aria-label="moon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </g>
              </svg>
            ) : (
              <svg
                aria-label="sun"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="m4.93 4.93 1.41 1.41"></path>
                  <path d="m17.66 17.66 1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="m6.34 17.66-1.41 1.41"></path>
                  <path d="m19.07 4.93-1.41 1.41"></path>
                </g>
              </svg>
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
              icon={
                <svg
                  aria-label="sun"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </g>
                </svg>
              }
              onClick={() => toggleTheme("light")}
              className="w-full p-2 bg-[transparent] border-none shadow-none rounded-lg  hover:bg-[var(--Ai-think-bg)]"
            />
          </li>
          <li>
            <EAButton
              text="黑夜模式"
              icon={
                <svg
                  aria-label="moon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                >
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </g>
                </svg>
              }
              onClick={() => toggleTheme("dark")}
              className="flex w-full bg-[transparent] border-none shadow-none p-2 rounded-lg  hover:bg-[var(--Ai-think-bg)]"
            />
          </li>

          <li>
            <EAButton
              text="跟随系统"
              onClick={() => toggleTheme("system")}
              className=" w-full  p-2 bg-[transparent] border-none shadow-none rounded-lg  hover:bg-[var(--Ai-think-bg)]"
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6H8C6.89543 6 6 6.89543 6 8V18C6 19.1046 6.89543 20 8 20H18C19.1046 20 20 19.1046 20 18V8C20 6.89543 19.1046 6 18 6Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M18 28H8C6.89543 28 6 28.8954 6 30V40C6 41.1046 6.89543 42 8 42H18C19.1046 42 20 41.1046 20 40V30C20 28.8954 19.1046 28 18 28Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M35 20C38.866 20 42 16.866 42 13C42 9.13401 38.866 6 35 6C31.134 6 28 9.13401 28 13C28 16.866 31.134 20 35 20Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M40 28H30C28.8954 28 28 28.8954 28 30V40C28 41.1046 28.8954 42 30 42H40C41.1046 42 42 41.1046 42 40V30C42 28.8954 41.1046 28 40 28Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linejoin="round"
                  />
                </svg>
              }
            />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EATheme;

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setTheme } from "@/store/modules/themeStore";
const EATheme = () => {
  const [isDark, setIsDark] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const theme = window.matchMedia("(prefers-color-scheme: dark)");

    // 首次加载时
    const initialTheme = theme.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", initialTheme);
    setIsDark(theme.matches);

    // 监听系统主题变化
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      setIsDark(e.matches);
    };
    theme.addEventListener("change", handleChange);

    return () => theme.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    setIsDark(!isDark);
    dispatch(setTheme(newTheme));
  };

  return (
    <label className="toggle cursor-pointer">
      <input
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        className="hidden"
      />

      <svg
        aria-label="sun"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
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

      <svg
        aria-label="moon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
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
    </label>
  );
};

export default EATheme;

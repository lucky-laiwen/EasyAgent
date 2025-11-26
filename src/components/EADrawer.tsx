import type React from "react";
import {
  type ChatItem,
  type WeatherSearchItem,
  type WebSearchItem,
} from "@/store/store";
import { Empty } from "antd";
interface EADrawerSchema {
  message?: ChatItem; // 支持可选
  footer?: React.ReactNode | null;
  className?: string;
  handleClose?: () => void;
}

const EADrawer: React.FC<EADrawerSchema> = ({
  message,
  footer,
  className,
  handleClose,
}) => {
  const renderContent = () => {
    if (!message?.tool_content || !Array.isArray(message.tool_content))
      return null;

    return (
      <div className="w-full px-4 pt-[2%] pb-[13%] h-full flex flex-col overflow-y-auto gap-2">
        {message.tool_name === "web_search"
          ? (message.tool_content as WebSearchItem[]).map((tool) => {
              const domain = (() => {
                try {
                  return new URL(tool.href).hostname;
                } catch {
                  return "";
                }
              })();

              const favicon = domain
                ? `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`
                : "";

              return (
                <a
                  key={tool.href}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[100%] mt-2 p-4 rounded-xl bg-white/10 hover:bg-white/30 transition-all duration-300 border border-[var(--chat-border)] shadow-sm cursor-pointer flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-1">
                    {favicon && (
                      <img
                        src={favicon}
                        alt="icon"
                        className="w-4 h-4 rounded-sm"
                        loading="lazy"
                      />
                    )}
                    <div className="font-semibold text-[var(--Ai-content-text)] line-clamp-1">
                      {tool.title}
                    </div>
                  </div>
                  <div className="text-sm text-[var(--Ai-think-text)] line-clamp-3">
                    {tool.body}
                  </div>
                </a>
              );
            })
          : (message.tool_content as WeatherSearchItem[]).map(
              (item: WeatherSearchItem) => {
                return (
                  <div
                    key={item.ymd}
                    className="w-full mt-2 p-3 rounded-xl bg-gradient-to-br from-blue-50/40 to-white/10 backdrop-blur-sm border border-[var(--chat-border)] shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-200 flex flex-col gap-2 text-sm"
                  >
                    {/* 顶部：日期 + AQI */}
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-[var(--Ai-content-text)]">
                        📅 {item.ymd} ({item.week})
                      </div>
                      <div className="px-2 py-0.5 rounded-full text-xs font-medium">
                        AQI: {item.aqi}
                      </div>
                    </div>

                    {/* 中间：温度 & 天气/风向 */}
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[var(--Ai-think-text)]">
                          🌡 温度
                        </span>
                        <span className="font-medium">
                          {item.low} ~ {item.high}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 text-[var(--Ai-think-text)]">
                        <span>☀️ {item.type}</span>
                        <span>
                          💨 {item.fx} {item.fl}
                        </span>
                      </div>
                    </div>

                    {/* 底部：日出日落 */}
                    <div className="flex justify-between mt-1 text-[var(--Ai-think-text)]">
                      <span>🌅 {item.sunrise}</span>
                      <span>🌇 {item.sunset}</span>
                    </div>

                    {/* 小贴士 */}
                    <div className="mt-1 p-2 bg-white/20 rounded-lg text-[var(--Ai-content-text)] italic shadow-inner text-xs">
                      📝 {item.notice}
                    </div>
                  </div>
                );
              }
            )}
      </div>
    );
  };

  return (
    <div
      className={`
        h-full transition-all duration-300 ease-in-out
        ${message ? "w-[25%] !opacity-100" : "w-0 !opacity-0"}
        ${className ?? ""}
      `}
    >
      {/* Title */}
      <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-bold">{message?.tool_name ?? ""}</h3>
        <button
          className="text-lg font-bold cursor-pointer"
          onClick={handleClose}
        >
          ×
        </button>
      </div>

      {/* Content */}
      {message?.tool_content && Array.isArray(message.tool_content) ? (
        renderContent()
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center flex-shrink-0">
          <Empty description="" className="!flex flex-shrink-0"></Empty>
          <p className="flex flex-shrink-0">无内容</p>
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="px-4 py-2 border-t border-gray-200">{footer}</div>
      )}
    </div>
  );
};

export default EADrawer;

import type React from "react";
import {
  useStore,
  type ChatItem,
  type WeatherSearchItem,
  type WebSearchItem,
  updateUserChat,
  type UserFriendSchema,
} from "@/store/store";
import { Empty } from "antd";
import { getHistory, createChatSocket } from "@/api/userChat";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
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
  const userInfo = useStore((state) => state.user);
  const chatOpen = useStore((state) => state.chatOpen);
  const userChat = useStore((state) => state.userChat);
  const userFriend = useStore((state) => state.userFriend);
  const curFriendInfo = useRef<UserFriendSchema | null>(null);
  const [inputValue, setInputValue] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const chatRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    // 只在组件挂载时创建 WebSocket
    if (!socketRef.current && userInfo) {
      socketRef.current = createChatSocket(userInfo?.id);

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established");
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket Error: ", error);
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        const currentUserChat = useStore.getState().userChat;

        if (data.type === "update_message_status") {
          updateUserChat(
            currentUserChat.map((item) =>
              item.id === data.id ? { ...item, status: data.status } : item
            )
          );
        } else {
          if (
            data.receiver_id === userInfo?.id &&
            data.sender_id === curFriendInfo.current?.friend.id
          ) {
            updateUserChat([...currentUserChat, data]);
          }
        }
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            const currentUserChat = useStore.getState().userChat;
            const messageItem = currentUserChat.find(
              (item) =>
                item.id === Number(messageId) &&
                item.status === 0 &&
                item.sender_id !== userInfo?.id
            );

            if (
              messageItem &&
              socketRef.current?.readyState === WebSocket.OPEN
            ) {
              socketRef.current.send(
                JSON.stringify({
                  to_user_id: curFriendInfo.current?.friend.id,
                  messageId: messageItem.id,
                })
              );
            }
          }
        });
      },
      { root: null, threshold: 1 }
    );

    chatRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [userChat]);

  const sendMessage = () => {
    socketRef.current?.send(
      JSON.stringify({
        to_user_id: curFriendInfo.current?.friend.id,
        content: inputValue,
      })
    );
    if (curFriendInfo.current?.friend.id) {
      getChatList(curFriendInfo.current?.friend.id);
    }
    setInputValue("");
  };

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

  function formatDate(item: string) {
    const now = dayjs();
    const createdAt = dayjs(item);

    // 判断是否是今天
    if (createdAt.isSame(now, "day")) {
      // 如果是今天，显示时:分
      return createdAt.format("HH:mm");
    }

    // 判断是否是今年
    if (createdAt.isSame(now, "year")) {
      // 如果是今年，显示月/日
      return createdAt.format("MM-DD HH:mm");
    }

    // 超过一年，显示年份+月/日
    return createdAt.format("YYYY-MM-DD HH:mm");
  }

  const getChatList = async (id: number) => {
    const res = await getHistory(id);
    updateUserChat(res.data.data || []);
    const filteredFriend = userFriend.filter((item) => item.friend.id === id);
    curFriendInfo.current =
      filteredFriend.length > 0 ? filteredFriend[0] : null;
  };
  return (
    <div
      className={`
        h-full transition-all duration-300 ease-in-out
        ${
          message
            ? "w-[25%] !opacity-100"
            : chatOpen
            ? "w-[35%] !opacity-100"
            : "w-0 !opacity-0"
        }
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
      {chatOpen ? (
        <div className="w-full h-full flex">
          {/* 左侧：好友列表 */}
          {userFriend.length > 0 && (
            <div className="w-[30%] overflow-y-auto h-full border-r border-gray-200">
              {userFriend.map((item) => {
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                      item.friend.id === curFriendInfo.current?.friend.id
                        ? "bg-[var(--Ai-think-bg)]"
                        : "hover:bg-[var(--Ai-think-bg)]/40"
                    }`}
                    onClick={() => getChatList(item.friend.id)}
                  >
                    <img
                      src={item.friend.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {item.friend.name}
                      </div>
                      <div className="text-xs">ID: {item.friend.id}</div>
                    </div>

                    {/* 在线状态点（可选） */}
                    <div
                      className={`
                        w-2.5 h-2.5 rounded-full
                        ${item.status === 1 ? "bg-green-500" : "bg-gray-400"}
                      `}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 右侧：聊天内容 */}

          <div className="flex flex-col flex-1 overflow-y-auto h-full ">
            {/* 聊天框 */}
            {userChat.length > 0 && (
              <div className="w-full h-[80%] overflow-y-auto p-4 ">
                {userChat.map((item, index) => {
                  const isMe = item.sender_id === userInfo?.id;

                  return (
                    <div
                      key={item.id}
                      ref={(el) => void (chatRefs.current[index] = el)}
                      data-message-id={item.id}
                      className={`chat ${isMe ? "chat-end" : "chat-start"}`}
                    >
                      <div className="chat-image avatar">
                        <div className="w-10 rounded-full">
                          <img
                            src={
                              isMe
                                ? userInfo?.avatar
                                : curFriendInfo.current?.friend.avatar
                            }
                          />
                        </div>
                      </div>
                      <div className="chat-header">
                        {isMe
                          ? userInfo.name
                          : curFriendInfo.current?.friend.name}
                        <time className="text-xs opacity-50">
                          {formatDate(item.created_at)}
                        </time>
                      </div>
                      <div className="chat-bubble whitespace-pre-wrap">
                        {item.content}
                      </div>
                      <div className="chat-footer opacity-50">
                        {item.status === 0 ? "未读" : "已读"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* 输入框 */}
            <div className="w-full h-[20%] mt-[auto] border-t border-gray-200">
              <textarea
                className="textarea resize-none w-full !h-[100%] outline-none border-none focus:outline-none"
                placeholder="请输入内容"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.shiftKey) && e.key === "Enter") {
                    setInputValue((prevValue) => prevValue + "\n");
                    e.preventDefault();
                  } else if (e.key === "Enter") {
                    const content = inputValue.trim();
                    if (content) {
                      sendMessage();
                      setInputValue("");
                    }
                    e.preventDefault();
                  }
                }}
              ></textarea>
            </div>
          </div>
        </div>
      ) : message?.tool_content && Array.isArray(message.tool_content) ? (
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

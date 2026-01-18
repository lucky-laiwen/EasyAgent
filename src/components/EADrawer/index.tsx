import type React from "react";
import {
  useStore,
  type ChatItem,
  type ToolContentSchema,
  type WeatherSearchItem,
} from "@/store/store";
import { Empty } from "antd";
import Weather from "./ToolPage/Weather";
import Texts from "./ToolPage/Texts";
import News from "./ToolPage/News";
import Images from "./ToolPage/Images";
import {
  updateUserChat,
  type UserFriendSchema,
  updateAllChatMsg,
} from "@/store/store";
import { getHistory, getAllMessageList } from "@/api/userChat";
import { useState, useEffect, useRef, useMemo } from "react";
import dayjs from "dayjs";
import Logo from "@/assets/EasyAgent-Logo.svg";
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
  const chatOpen = useStore((state) => state.chatOpen);
  const [active, setActive] = useState("news"); // 当前高亮 tab
  const allMsg = useStore((state) => state.allChatMsg);
  const unreadMsg = useStore((state) => state.unReadMsg);
  const userInfo = useStore((state) => state.user);
  const userChat = useStore((state) => state.userChat);
  const userFriend = useStore((state) => state.userFriend);
  const curFriendInfo = useRef<UserFriendSchema | null>(null);
  const [inputValue, setInputValue] = useState("");
  const socketRef = useStore((state) => state.socket);
  const chatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!chatOpen) {
      curFriendInfo.current = null;
    }
    // 只在组件挂载时创建 WebSocket
    if (socketRef && userInfo) {
      socketRef.onopen = () => {
        console.log("WebSocket connection established");
      };

      socketRef.onerror = (error) => {
        console.error("WebSocket Error: ", error);
      };

      socketRef.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "update_message_status") {
          useStore.setState((state) => ({
            userChat: state.userChat.map((item) =>
              item.id === data.id ? { ...item, status: data.status } : item
            ),
          }));
          useStore.setState((state) => ({
            unReadMsg: state.unReadMsg.filter((item) => item.id !== data.id),
          }));
        } else {
          if (data.receiver_id === userInfo?.id) {
            updateAllChatMsg([...allMsg, data]);
          }
          if (
            data.receiver_id === userInfo?.id &&
            data.sender_id === curFriendInfo.current?.friend.id
          ) {
            useStore.setState((state) => ({
              userChat: [...state.userChat, data],
            }));
          }
          if (data.receiver_id === userInfo?.id && data.status === 0) {
            useStore.setState((state) => ({
              unReadMsg: [...state.unReadMsg, data],
            }));
          }
        }
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target as HTMLElement;
          const id = Number(el.getAttribute("data-message-id"));

          const message = useStore
            .getState()
            .userChat.find(
              (m) =>
                m.id === id && m.status === 0 && m.sender_id !== userInfo?.id
            );

          // ❌ 已读 / 不存在 / 自己发的 → 直接退出并取消观察
          if (!message) {
            observer.unobserve(el);
            return;
          }

          if (socketRef?.readyState === WebSocket.OPEN) {
            socketRef.send(
              JSON.stringify({
                to_user_id: curFriendInfo.current?.friend.id,
                messageId: id,
              })
            );
          }

          // ✅ 核心：命中一次后立刻 unobserve
          observer.unobserve(el);
        });
      },
      { root: null, threshold: 1 }
    );

    chatRefs.current.forEach((el) => {
      if (!el) return;
      const id = Number(el.getAttribute("data-message-id"));
      const message = useStore.getState().userChat.find((m) => m.id === id);
      if (!message || message.status !== 0) return;

      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [userChat, unreadMsg, userInfo, chatOpen, socketRef, allMsg]);

  useEffect(() => {
    const last = userChat[userChat.length - 1];
    if (!last) return;

    if (
      last.sender_id === userInfo?.id ||
      last.sender_id === curFriendInfo.current?.friend.id
    ) {
      chatListRef.current?.scrollTo({
        top: chatListRef.current.scrollHeight,
        behavior: "instant",
      });
    }
  }, [userChat]);

  const sendMessage = async () => {
    socketRef?.send(
      JSON.stringify({
        to_user_id: curFriendInfo.current?.friend.id,
        content: inputValue,
      })
    );
    const res = await getAllMessageList();
    if (res.data.success) {
      updateAllChatMsg(res.data.data || []);
    }

    if (curFriendInfo.current?.friend.id) {
      getChatList(curFriendInfo.current?.friend.id);
    }
    setInputValue("");
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

  const sortedFriends = useMemo(() => {
    // 1. 计算每个好友的最新消息时间
    const lastMsgMap = new Map<number, number>();

    allMsg.forEach((msg) => {
      const time = new Date(msg.created_at).getTime();
      const prev = lastMsgMap.get(msg.sender_id) ?? 0;
      if (time > prev) {
        lastMsgMap.set(msg.sender_id, time);
      }
    });

    // 2. 排序好友
    return [...userFriend].sort((a, b) => {
      const unreadA = allMsg.some(
        (m) => m.sender_id === a.friend.id && m.status === 0
      );
      const unreadB = allMsg.some(
        (m) => m.sender_id === b.friend.id && m.status === 0
      );

      if (unreadA !== unreadB) {
        return unreadB ? 1 : -1;
      }

      const timeA = lastMsgMap.get(a.friend.id) ?? 0;
      const timeB = lastMsgMap.get(b.friend.id) ?? 0;

      return timeB - timeA;
    });
  }, [userFriend, allMsg]);
  /** 只负责 Tool 内容 */
  const renderToolContent = () => {
    if (!message?.tool_content) return null;

    if (message.tool_name === "web_search") {
      const toolContent = message.tool_content as ToolContentSchema;
      return (
        <div className="relative w-full h-[95%] overflow-y-auto">
          {/* 1. 固定栏 */}
          <div className="sticky top-0 z-10 bg-base-100">
            <div className="tabs tabs-lift">
              {["news", "text", "image"].map((key) => (
                <a
                  key={key}
                  className={`tab tab-lift ${
                    active === key ? "tab-active" : ""
                  }`}
                  onClick={() => setActive(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              ))}
            </div>
          </div>

          {/* 2. 内容区 */}
          <div className="pb-6 pt-2 px-2">
            {active === "news" && <News newsData={toolContent.news} />}
            {active === "text" && <Texts TextsData={toolContent.text} />}
            {active === "image" && <Images imagesData={toolContent.imgs} />}
          </div>
        </div>
      );
    }
    if (message.tool_name === "weather_query") {
      return (
        <div className="px-2 pb-[13%] h-full overflow-y-auto">
          <Weather weatherData={message.tool_content as WeatherSearchItem[]} />
        </div>
      );
    }
  };

  /** Drawer 主体必须 return */
  return (
    <div
      className={`
        h-full transition-all duration-300 ease-in-out
        ${
          message
            ? `w-[${
                message.tool_name === "weather_query" ? "25%" : "35%"
              }] !opacity-100`
            : chatOpen
            ? "w-[35%] !opacity-100"
            : "w-0 !opacity-0"
        }
        ${className ?? ""}
      `}
    >
      {/* Title */}
      <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-bold">
          {chatOpen ? "聊天" : message?.tool_name ?? ""}
        </h3>
        <button
          className="text-lg font-bold cursor-pointer"
          onClick={handleClose}
        >
          ×
        </button>
      </div>

      {/* Content */}
      {chatOpen ? (
        <div
          className={`
        h-full w-full transition-all duration-300 ease-in-out
        `}
        >
          {/* Content */}
          {chatOpen && (
            <div className="w-full h-full flex">
              {/* 左侧：好友列表 */}
              {userFriend.length > 0 && (
                <div className="w-[30%] overflow-y-auto h-full border-r border-gray-200">
                  {sortedFriends.map((item) => {
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
                          <div className="text-xs text-[var(--Ai-think-text)]">
                            {allMsg
                              .filter(
                                (f) =>
                                  f.sender_id === item.friend.id ||
                                  f.receiver_id === item.friend.id
                              )
                              .at(-1)?.content || ""}
                          </div>
                        </div>

                        {/* 未读消息数 */}
                        {unreadMsg.filter(
                          (unMsg) =>
                            unMsg.sender_id === item.friend.id &&
                            unMsg.status === 0
                        ).length > 0 && (
                          <span
                            className="
                          min-w-[18px] h-[18px]
                          px-1
                          flex items-center justify-center
                          rounded-full
                          bg-rose-500/90
                          text-[11px] font-medium text-white
                          shadow-sm
                        "
                          >
                            {
                              unreadMsg.filter(
                                (unMsg) =>
                                  unMsg.sender_id === item.friend.id &&
                                  unMsg.status === 0
                              ).length
                            }
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 右侧：聊天内容 */}
              {userChat.length > 0 || curFriendInfo.current ? (
                <div className="flex flex-col flex-1 overflow-y-auto h-full ">
                  {/* 聊天框 */}
                  {userChat.length > 0 && (
                    <div
                      className="w-full h-[80%] overflow-y-auto p-4 "
                      ref={chatListRef}
                    >
                      {userChat.map((item) => {
                        const isMe = item.sender_id === userInfo?.id;

                        return (
                          <div
                            key={item.id}
                            ref={(el) => void (chatRefs.current[item.id] = el)}
                            data-message-id={item.id}
                            className={`chat ${
                              isMe ? "chat-end" : "chat-start"
                            }`}
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
              ) : (
                <div className="w-[70%] flex justify-center items-center h-full aspect-square overflow-hidden rounded-lg">
                  <img
                    src={Logo}
                    alt=""
                    className="w-[50%] h-[30%] object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : message?.tool_content ? (
        renderToolContent()
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <Empty description="" />
          <p>无内容</p>
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

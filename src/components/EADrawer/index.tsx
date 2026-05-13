import type React from "react";
import {
  useStore,
  type ChatItem,
  type ToolContentSchema,
  type UserChatSchema,
  type WeatherSearchItem,
  type ToolCall,
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
import {
  getHistory,
  getAllMessageList,
  confirmReceiveSharedMessage,
} from "@/api/userChat";
import { useState, useEffect, useRef, useMemo } from "react";
import dayjs from "dayjs";
import UserChatIcon from "@/LootieJson/UserChat.json";
import EAMessage from "../EAMessage";
import SearchInput from "./ToolPage/SearchInput";
import Lottie from "lottie-react";
import SystemMessage from "./ToolPage/SystemMessage";
interface EADrawerSchema {
  message?: ChatItem; // 支持可选
  footer?: React.ReactNode | null;
  className?: string;
  handleClose?: () => void;
  getHistoryList?: () => void;
  chatList: ChatItem[];
  handleChatClick: (id: number) => void;
  getFriendListApi: () => void;
}

interface ShareChatSchema {
  id: number;
  title: string;
}

const EADrawer: React.FC<EADrawerSchema> = ({
  message,
  footer,
  className,
  handleClose,
  getHistoryList,
  chatList,
  handleChatClick,
  getFriendListApi,
}) => {
  const chatOpen = useStore((state) => state.chatOpen);
  const [active, setActive] = useState("news"); // 当前高亮 tab
  const [activeToolCallId, setActiveToolCallId] = useState<number | null>(null); // 当前选中的工具调用 ID
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [shareChat, setShareChat] = useState<ShareChatSchema | null>(null);
  const isSystem = useRef<boolean>(false);
  const newsRef = useRef<HTMLDivElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);

  // 同步 activeToolCallId 与父组件传入的 message.tool_calls
  useEffect(() => {
    if (!message?.tool_calls || message.tool_calls.length <= 1) {
      setActiveToolCallId(null);
      return;
    }
    // 当前选中的工具调用仍然有效时，保持不变（动态更新内容）
    const stillValid = message.tool_calls.some(
      (call) => call.id === activeToolCallId,
    );
    if (!stillValid) {
      setActiveToolCallId(message.tool_calls[0].id);
    }
  }, [message?.tool_calls]);

  useEffect(() => {
    newsRef.current?.scrollTo(0, 0);
    textsRef.current?.scrollTo(0, 0);
    imagesRef.current?.scrollTo(0, 0);
  }, [active]);

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
        if (data.type === "error") {
          EAMessage.error(data.message);
        }
        if (data.type === "update_message_status") {
          useStore.setState((state) => ({
            userChat: state.userChat.map((item) =>
              item.id === data.id ? { ...item, status: data.status } : item,
            ),
          }));
          useStore.setState((state) => ({
            unReadMsg: state.unReadMsg.filter((item) => item.id !== data.id),
          }));
        } else if (data.type === "add_friend") {
          useStore.setState((state) => ({
            systemInfo: [...state.systemInfo, data],
          }));
          getFriendListApi();
        } else if (data.type === "accept_friend_request") {
          getFriendListApi();
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
                m.id === id && m.status === 0 && m.sender_id !== userInfo?.id,
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
              }),
            );
          }

          // ✅ 核心：命中一次后立刻 unobserve
          observer.unobserve(el);
        });
      },
      { root: null, threshold: 1 },
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
        chatId: shareChat?.id,
        title: shareChat?.title,
      }),
    );
    const res = await getAllMessageList();
    if (res.data.success) {
      updateAllChatMsg(res.data.data || []);
    }
    setShareChat(null);

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

  const getChatList = async (id: number | string) => {
    if (id === "system") {
      isSystem.current = true;
      // 切到系统消息时，清空当前好友聊天，避免 UI 混淆
      updateUserChat([]);
      curFriendInfo.current = null;
    } else if (typeof id === "number") {
      isSystem.current = false;
      const res = await getHistory(id);
      updateUserChat(res.data.data || []);
      const filteredFriend = userFriend.filter((item) => item.friend.id === id);
      curFriendInfo.current =
        filteredFriend.length > 0 ? filteredFriend[0] : null;
    }
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
        (m) => m.sender_id === a.friend.id && m.status === 0,
      );
      const unreadB = allMsg.some(
        (m) => m.sender_id === b.friend.id && m.status === 0,
      );

      if (unreadA !== unreadB) {
        return unreadB ? 1 : -1;
      }

      const timeA = lastMsgMap.get(a.friend.id) ?? 0;
      const timeB = lastMsgMap.get(b.friend.id) ?? 0;

      return timeB - timeA;
    });
  }, [userFriend, allMsg]);

  /** 渲染单个工具调用内容 */
  const renderSingleToolContent = (toolCall: ToolCall) => {
    if (!toolCall.tool_content) return null;

    if (toolCall.tool_name === "web_search") {
      const toolContent = toolCall.tool_content as ToolContentSchema;
      const tabGroupName = `web-search-tabs-${toolCall.id}`;
      return (
        <div className="flex flex-col w-full h-[95%]">
          <div role="tablist" className="tabs tabs-lift h-full mt-3">
            <input
              type="radio"
              role="tab"
              name={tabGroupName}
              className="tab"
              aria-label="News"
              checked={active === "news"}
              onChange={() => setActive("news")}
            />
            <div
              role="tabpanel"
              ref={newsRef}
              className="tab-content bg-base-100 border-base-300 rounded-box p-2 min-h-0 overflow-y-auto"
            >
              <div className="pt-2 pb-6">
                <News newsData={toolContent.news} />
              </div>
            </div>

            <input
              type="radio"
              role="tab"
              name={tabGroupName}
              className="tab"
              aria-label="Text"
              checked={active === "text"}
              onChange={() => setActive("text")}
            />
            <div
              role="tabpanel"
              ref={textsRef}
              className="tab-content bg-base-100 border-base-300 rounded-box p-2 min-h-0 overflow-y-auto"
            >
              <div className="pt-2 pb-6">
                <Texts TextsData={toolContent.text} />
              </div>
            </div>

            <input
              type="radio"
              role="tab"
              name={tabGroupName}
              className="tab"
              aria-label="Image"
              checked={active === "image"}
              onChange={() => setActive("image")}
            />
            <div
              role="tabpanel"
              ref={imagesRef}
              className="tab-content bg-base-100 border-base-300 rounded-box p-2 min-h-0 overflow-y-auto"
            >
              <div className="pt-2 pb-6">
                <Images imagesData={toolContent.imgs} />
              </div>
            </div>
          </div>

          {/* 图片预加载容器：不可见但在 DOM 中，触发浏览器提前加载图片 */}
          <div className="absolute" style={{ left: "-9999px", top: "-9999px" }}>
            {toolContent.imgs?.map((item, index) => (
              <img key={index} src={item.image} alt="" loading="eager" />
            ))}
          </div>
        </div>
      );
    }
    if (toolCall.tool_name === "weather_query") {
      return (
        <div className="px-2 pb-[13%] h-full overflow-y-auto">
          <Weather weatherData={toolCall.tool_content as WeatherSearchItem[]} />
        </div>
      );
    }
    return null;
  };

  /** 只负责 Tool 内容 */
  const renderToolContent = () => {
    // 优先使用 tool_calls 数组
    if (message?.tool_calls && message.tool_calls.length > 0) {
      // 如果有多个工具调用，显示工具切换 tabs
      if (message.tool_calls.length > 1) {
        const selectedToolCallId = message.tool_calls.some(
          (call) => call.id === activeToolCallId,
        )
          ? activeToolCallId
          : message.tool_calls[0].id;
        const tabGroupName = `tool-calls-${message.id}`;

        return (
          <div role="tablist" className="tabs tabs-lift h-full">
            {message.tool_calls.flatMap((toolCall) => [
              <input
                key={`tool-tab-${toolCall.id}`}
                type="radio"
                role="tab"
                name={tabGroupName}
                className="tab"
                aria-label={getToolDisplayName(toolCall.tool_name)}
                checked={selectedToolCallId === toolCall.id}
                onChange={() => {
                  setActiveToolCallId(toolCall.id);
                  setActive("news"); // 重置子 tab
                }}
              />,
              <div
                key={`tool-panel-${toolCall.id}`}
                role="tabpanel"
                className="tab-content bg-base-100 border-base-300 rounded-box min-h-0 overflow-hidden"
              >
                <div className="h-full min-h-0 flex flex-col">
                  {renderSingleToolContent(toolCall)}
                </div>
              </div>,
            ])}
          </div>
        );
      }

      // 单个工具调用
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0">
            {renderSingleToolContent(message.tool_calls[0])}
          </div>
        </div>
      );
    }

    return null;
  };

  /** 获取工具显示名称 */
  const getToolDisplayName = (toolName: string) => {
    const nameMap: Record<string, string> = {
      web_search: "联网搜索",
      weather_query: "天气查询",
    };
    return nameMap[toolName] || toolName;
  };

  // 在 EADrawer 组件内部添加拖放处理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡

    // 检查是否已有分享的聊天
    if (shareChat) {
      EAMessage.info("只能同时分享一个聊天");
      setIsDragOver(false); // 重置拖拽状态
      return;
    }

    try {
      const dragData = e.dataTransfer.getData("application/chat");

      if (dragData) {
        const parsedData = JSON.parse(dragData);
        const is_exist = userChat.find(
          (item) => item.share_chat?.chat_id === parsedData.id,
        );
        if (is_exist) {
          EAMessage.info("您已经分享过此聊天");
          setIsDragOver(false); // 重置拖拽状态
          return;
        }
        setShareChat(parsedData);
        setIsDragOver(false); // 成功设置分享后重置拖拽状态
      }
    } catch (error) {
      console.error("解析拖拽数据失败:", error);
      setIsDragOver(false); // 发生错误时也重置状态
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止默认行为和事件冒泡
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 检查是否真的离开了拖拽区域
    const rect = chatListRef.current?.getBoundingClientRect();
    if (rect) {
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        setIsDragOver(false);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  // 确认接受分享
  const allowShard = async (msg: UserChatSchema) => {
    const is_has = chatList.find((item) => item.id === msg.share_chat?.chat_id);
    if (is_has && msg.share_chat?.chat_id) {
      handleChatClick(msg.share_chat?.chat_id);
      return;
    }
    if (msg.share_chat?.chat_id) {
      const res = await confirmReceiveSharedMessage(msg.share_chat.id);
      if (res.data.success) {
        getHistoryList?.();
        handleChatClick(msg.share_chat.chat_id);
      } else {
        EAMessage.error("此聊天已经失效");
      }
    }
  };

  // 输入框取消分享
  const handleCancelShare = () => {
    setShareChat(null);
    setIsDragOver(false);
  };

  /** Drawer 主体必须 return */
  return (
    <div
      className={`
        h-full transition-all duration-300 ease-in-out
        ${
          message
            ? "w-[35%] !opacity-100"
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
          {chatOpen
            ? "聊天"
            : message?.tool_calls && message.tool_calls.length > 0
              ? message.tool_calls.length > 1
                ? `工具调用 (${message.tool_calls.length})`
                : getToolDisplayName(message.tool_calls[0].tool_name)
              : ""}
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
              <div className="w-[30%] border-r border-gray-200">
                {/* 搜索框 */}
                <SearchInput />
                {userFriend.length > 0 && (
                  <div className="w-full overflow-y-auto h-full">
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
                                    f.receiver_id === item.friend.id,
                                )
                                .at(-1)?.content || ""}
                            </div>
                          </div>

                          {/* 未读消息数 */}
                          {unreadMsg.filter(
                            (unMsg) =>
                              unMsg.sender_id === item.friend.id &&
                              unMsg.status === 0,
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
                                    unMsg.status === 0,
                                ).length
                              }
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 右侧：聊天内容 */}
              {userChat.length > 0 ||
              curFriendInfo.current ||
              isSystem.current ? (
                isSystem.current ? (
                  <SystemMessage
                    formatDate={formatDate}
                    getFriendListApi={getFriendListApi}
                  />
                ) : (
                  <div
                    className="flex flex-col flex-1 overflow-y-auto h-full drop-zone relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                  >
                    {isDragOver && !shareChat && (
                      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                        <div className="absolute inset-0 bg-[var(--Ai-think-bg)]/60 backdrop-blur-sm flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="text-2xl mb-2">📤</div>
                            <span className="text-blue-600 font-semibold text-lg">
                              松开即可发送给好友
                            </span>
                            <div className="text-blue-500 text-sm mt-1">
                              拖拽聊天记录到此处分享
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 聊天框 */}
                    {userChat.length > 0 && (
                      <div
                        className={`w-full h-[80%] overflow-y-auto p-4 relative transition-all duration-200`}
                        ref={chatListRef}
                      >
                        {userChat.map((item) => {
                          const isMe = item.sender_id === userInfo?.id;
                          return (
                            <div
                              key={item.id}
                              ref={(el) =>
                                void (chatRefs.current[item.id] = el)
                              }
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
                              <div className="chat-message flex flex-col gap-2 max-w-[70%]">
                                {item.share_chat && (
                                  <div
                                    className="
                                    bg-base-200/60
                                    rounded-lg
                                    p-3
                                    text-sm
                                    border-l-4
                                    border-primary
                                    cursor-pointer
                                    hover:bg-base-200
                                    transition
                                  "
                                    onClick={() => {
                                      if (item.share_chat?.id && !isMe) {
                                        allowShard(item);
                                      }
                                    }}
                                  >
                                    <div className="text-xs opacity-60 mb-1 flex items-center gap-1">
                                      <span>🔗</span>
                                      <span>分享的聊天</span>
                                    </div>

                                    <div className="font-medium line-clamp-1">
                                      {item.share_chat.title}
                                    </div>

                                    <div className="text-xs opacity-60 mt-1">
                                      点击查看完整内容
                                    </div>
                                  </div>
                                )}

                                <div
                                  className={`chat-bubble whitespace-pre-wrap ${isMe && "ml-[auto]"}`}
                                >
                                  {item.content}
                                </div>
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
                    <div className="w-full h-[20%] mt-[auto] border-t border-gray-200 overflow-y-auto">
                      {shareChat && (
                        <div className="px-4 py-2 border-t border-gray-200 bg-blue-50 rounded-lg mx-4 mt-2 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-blue-500"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  准备分享:
                                </p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {shareChat.title}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleCancelShare}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
                )
              ) : (
                <div className="w-[70%] flex justify-center items-center h-full aspect-square overflow-hidden rounded-lg">
                  <Lottie
                    animationData={UserChatIcon}
                    loop={true}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : message?.tool_calls && message.tool_calls.length > 0 ? (
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

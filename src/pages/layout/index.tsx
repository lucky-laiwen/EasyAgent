import React, { useEffect, useRef, useState } from "react";
import { Layout, Spin, message } from "antd";
import { getChatRecords, getChatContent, createChat } from "@/api/chat";
import EAButton from "@/components/EAButton";
import EAInput from "@/components/EAInput";
import { useNavigate } from "react-router-dom";
import EAMenu from "@/components/EAMenu/index";
import EAMarkdown from "@/components/EAMarkdown/EAMarkdown";
import { addMessage, setMessages, useStore } from "@/store/store";
import EATheme from "@/components/EAThema";
import { useStreamAIMessage } from "@/utils/stream";
import { setUser } from "@/store/store";
import { logout } from "@/api/user";
const { Content } = Layout;
export interface ChatItem {
  id: number;
  sender: 0 | 1;
  content: string;
  title?: string;
  think_content?: string;
  type?: string;
  finished?: boolean;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { streamAIMessage } = useStreamAIMessage();
  const messages = useStore((state) => state.messages) ?? [];
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const hideLoading = useStore((store) => store.hideLoading);
  const showLoading = useStore((store) => store.showLoading);
  const [messagesApi] = message.useMessage();
  const divRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  // 将对话聊天滚动到最底部
  const scrollToBottom = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight + 50,
      behavior: "smooth",
    });
  };

  // 获取历史记录
  const getHisttoryList = async () => {
    const res = await getChatRecords({});
    if (res.data.success) {
      setChatList(res.data.data.chat_list as ChatItem[]);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      hideLoading();
    }, 300);
    getHisttoryList();

    const container = messageContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollHeight - scrollTop - clientHeight < 60;
      setIsUserAtBottom(atBottom);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [hideLoading]);

  // 当 message 更新时自动滚动
  useEffect(() => {
    if (isUserAtBottom) scrollToBottom();
  }, [messages]);
  if (!localStorage.getItem("token")) {
    navigate("/login");
    return null;
  }

  // 切换指定内容
  const handleChatClick = async (id: number) => {
    setPageLoading(true);
    const res = await getChatContent(id);
    if (res.data.success) {
      const messagesWithType = (res.data.data as ChatItem[]).map((item) => ({
        ...item,
        type: item.think_content ? "think" : "text",
        finished: true,
      }));
      setMessages(messagesWithType);
      setCurrentChatId(id);
      setPageLoading(false);
    } else {
      setPageLoading(false);
    }
  };

  // 发送消息（流式接收）
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const sendText = inputValue;
    setInputValue("");
    setLoading(true);

    // 插入用户信息
    addMessage({
      id: Date.now(),
      sender: 0,
      content: sendText,
      finished: true,
    });

    setTimeout(scrollToBottom, 100);

    // 获取 chatId（如果没有就用时间戳）
    const chatId =
      currentChatId ??
      Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    // 1. 创建聊天请求
    const result = await createChat({
      id: chatId,
      message: sendText,
    });
    if (result.data.success) {
      const chatId = result.data.data.chat_id;
      setCurrentChatId(chatId);
      setSelectedMenuKey(chatId.toString());
      getHisttoryList();

      streamAIMessage(chatId, sendText);
      setLoading(false);
    }
  };

  // 注销账户
  const handleLogout = async () => {
    const res = await logout();
    if (res.data.success) {
      showLoading();
      setTimeout(() => {
        localStorage.removeItem("token");
        setMessages([]);
        setUser(null);
        navigate("/login");
      }, 1000);
    } else {
      messagesApi.error("logout failed");
    }
  };

  return (
    <div className="flex h-screen">
      {/* 左侧菜单栏 */}
      <div className="flex flex-col border-r-[10px] border-base-300 w-[260px] flex-shrink-0 transition-width duration-300">
        {/* 让上半部分（EAMenu）自动占满剩余空间 */}
        <div className="flex-1 overflow-y-auto">
          <EAMenu
            className="!bg-transparent"
            chatList={chatList}
            handleChatClick={handleChatClick}
            selectedKey={selectedMenuKey}
            onSelectedKeyChange={setSelectedMenuKey}
            getHisttoryList={getHisttoryList}
          />
        </div>

        {/* 固定底部操作区 */}
        <div className="flex flex-col gap-2 mt-2 border-t border-base-300 p-2 relative">
          <EAButton
            text="创建新会话"
            onClick={() => {
              setMessages([]);
              setCurrentChatId(null);
              setSelectedMenuKey("");
            }}
          />
          <EAButton text="删除账号" onClick={handleLogout} />
          <EAButton
            text="退出登录"
            onClick={() => {
              showLoading();
              setTimeout(() => {
                localStorage.removeItem("token");
                setMessages([]);
                setUser(null);
                navigate("/login");
              }, 1000);
            }}
          />
          <EATheme />
        </div>
      </div>

      <Layout className="!w-[auto]">
        <Spin spinning={pageLoading}>
          <Content
            ref={divRef}
            className="flex flex-col p-6 justify-between h-screen overflow-auto bg-base-200 relative"
          >
            <div
              ref={messageContainerRef}
              className="overflow-y-auto w-[100%]  px-[21%] flex flex-col"
            >
              <div
                className={`absolute top-[85%] right-[18%] z-10 transition-opacity duration-300 ${
                  !isUserAtBottom
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <button
                  className="btn btn-lg btn-circle btn-primary"
                  onClick={scrollToBottom}
                >
                  F
                </button>
              </div>

              {messages.map((item) => {
                return (
                  <div key={item.id} className="w-full flex flex-col mb-4 ">
                    {/* 思考内容 */}
                    {item.think_content && (
                      <div className="px-3 w-[100%] py-2 rounded-lg rounded-bl-none rounded-br-none mt-2 bg-[var(--Ai-think-bg)] text-[var(--Ai-think-text)] text-sm italic">
                        <EAMarkdown
                          content={item.think_content}
                          showCursor={!item.finished && item.sender === 1}
                        />
                      </div>
                    )}
                    {/* 工具名称 */}
                    {item.tool_name && (
                      <div
                        className="group relative flex items-center gap-3 p-4 my-2 w-[60%] rounded-2xl shadow-md 
               bg-gradient-to-r from-[var(--Ai-content-bg)]/90 to-[var(--Ai-content-bg)]/60 
               backdrop-blur-md border border-white/10 transition-all duration-300 
               hover:scale-[1.02] hover:shadow-lg hover:border-primary/40 cursor-pointer"
                      >
                        {/* 左侧图标区 */}
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-xl 
                    bg-primary/20 text-primary font-semibold text-lg"
                        >
                          ⚙️
                        </div>

                        {/* 内容区 */}
                        <div className="flex flex-col text-[var(--Ai-content-text)]">
                          <div className="text-[15px] font-semibold tracking-wide">
                            {item.tool_name}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            系统调用的工具结果
                          </p>
                        </div>
                      </div>
                    )}
                    {item.tool_content &&
                      item.tool_content.map((tool) => {
                        return (
                          <div
                            key={tool.href}
                            className="p-2 mb-2 border rounded-lg bg-white/10"
                          >
                            <div className="font-semibold">{tool.title}</div>
                            <div className="text-sm text-gray-300">
                              {tool.body}
                            </div>
                            <a
                              href={tool.href}
                              className="text-blue-400 underline"
                              target="_blank"
                            >
                              {tool.href}
                            </a>
                          </div>
                        );
                      })}
                    {/* 主要内容 */}
                    {item.content && (
                      <div
                        className={`px-4 py-2   leading-8 ${
                          item.sender === 0
                            ? "bg-blue-500 text-white msx-w-[100%] rounded-lg ml-auto"
                            : "bg-[var(--Ai-content-bg)] w-[100%] rounded-lg rounded-tl-none rounded-tr-none text-[var(--Ai-content-text)] mr-auto"
                        }`} // <-- 关键
                      >
                        <EAMarkdown
                          content={item.content}
                          showCursor={!item.finished && item.sender === 1}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              ref={inputWrapperRef}
              className={`flex justify-center items-center w-[99.1%] translation-all duration-500 transform-gpu ${
                messages.length > 0 ? "translate-y-[0px]" : ""
              }`}
            >
              <EAInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                sendMessage={handleSend}
                loading={loading}
              />
            </div>
          </Content>
        </Spin>
      </Layout>
    </div>
  );
};

export default Home;

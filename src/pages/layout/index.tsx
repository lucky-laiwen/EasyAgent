import React, { useEffect, useRef, useState } from "react";
import { Layout, Spin } from "antd";
import {
  getChatRecords,
  getChatContent,
  createChat,
  generateChatTitle,
} from "@/api/chat";
import EAButton from "@/components/EAButton";
import EAInput from "@/components/EAInput";
import { useNavigate } from "react-router-dom";
import EAMenu from "@/components/EAMenu/index";
import EAMarkdown from "@/components/EAMarkdown/EAMarkdown";
import { addMessage, setMessages, useStore } from "@/store/store";
import gsap from "gsap";
import EATheme from "@/components/EAThema";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useStreamAIMessage } from "@/utils/stream";
const { Content } = Layout;
gsap.registerPlugin(ScrollToPlugin);
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
  const message = useStore((state) => state.messages) ?? [];
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // 将对话聊天滚动到最底部
  const scrollToBottom = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    gsap
      .to(container, {
        scrollTop: container.scrollHeight,
        duration: 1.5,
        ease: "power2.inOut",
        overwrite: "auto", // 自动覆盖当前滚动动画
      })
      .then(() => {
        gsap.killTweensOf(container);
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
    getHisttoryList();
    const container = messageContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop } = container;
      const isNotAtBottom = scrollTop !== 0;
      setShowScrollButton(isNotAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    // 初始化判断
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);
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

    // 获取 chatId（如果没有就用时间戳）
    const chatId =
      currentChatId ??
      Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    // 1. 创建聊天请求
    const createChatPromise = createChat({
      id: chatId,
      message: sendText,
    });

    createChatPromise
      .then((result) => {
        if (result.data.success) {
          const chatId = result.data.data.chat_id;
          setCurrentChatId(chatId);
          setSelectedMenuKey(chatId.toString());

          // 立即启动流式消息，不等待标题更新
          streamAIMessage(chatId, sendText).then(() =>
            setTimeout(scrollToBottom, 200)
          );

          // 单独更新标题
          if (message.length === 2) {
            generateChatTitle({
              id: chatId,
              message: sendText,
            }).then((res) => {
              if (res.data.success) getHisttoryList();
            });
          }
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-between pt-[20px] overflow-y-auto border-r-[10px] border-base-300 w-[260px] flex-shrink-0">
        <EAMenu
          className="max-h-[calc(100vh-328px)] overflow-y-auto !bg-[transparent]"
          chatList={chatList}
          handleChatClick={handleChatClick}
          selectedKey={selectedMenuKey}
          onSelectedKeyChange={setSelectedMenuKey}
          getHisttoryList={getHisttoryList}
        />
        <div className="flex flex-col">
          <EAButton
            text="退出登录"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="mt-[auto]"
          />
          <EAButton
            text="创建新会话"
            onClick={() => {
              setMessages([]);
              setCurrentChatId(null);
              setSelectedMenuKey(""); // 清空菜单选中
            }}
            className="mt-[auto]"
          />
          <EATheme />
        </div>
      </div>
      <Layout>
        <Spin spinning={pageLoading}>
          <Content className="flex flex-col p-6 justify-between h-screen overflow-auto bg-base-200 gap-[20px] relative">
            <div
              ref={messageContainerRef}
              className="overflow-y-auto w-[100%] px-[20%] flex flex-col-reverse"
            >
              <div
                className={`absolute top-[85%] right-[18%] z-10 transition-opacity duration-300 ${
                  showScrollButton
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

              {[...message].reverse().map((item) => {
                return (
                  <div key={item.id} className="w-full flex flex-col mb-4 ">
                    {item.think_content && (
                      <div className="px-3 w-[100%] py-2 rounded-lg rounded-bl-none rounded-br-none mt-2 bg-[var(--Ai-think-bg)] text-[var(--Ai-think-text)] text-sm italic">
                        <EAMarkdown
                          content={item.think_content}
                          showCursor={!item.finished && item.sender === 1}
                        />
                      </div>
                    )}
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
              className={`flex justify-center items-center w-full translation-all duration-500 transform-gpu mt-[20px] ${
                message.length > 0 ? "translate-y-[0%]" : ""
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

import React, { useEffect, useRef, useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, Input, Spin } from "antd";
import { getChatRecords, getChatContent, createChat } from "@/api/chat";
import EAButton from "@/components/EAButton";
import { useNavigate } from "react-router-dom";
import EAMenu from "@/components/EAMenu/index";
import EAMarkdown from "@/components/EAMarkdown/EAMarkdown";
import { useDispatch } from "react-redux";
import {
  addMessage,
  resetMessages,
  setMessages,
} from "@/store/modules/messageStore";
import { useStreamAIMessage } from "@/utils/stream";
import { useSelector } from "react-redux";
import { type RootState } from "@/store/index";
import gsap from "gsap";
import EATheme from "@/components/EAThema";
const { Sider, Content } = Layout;

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const message = useSelector(
    (state: RootState) => state.message.messages ?? []
  );
  const [collapsed, setCollapsed] = useState(false);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const { streamAIMessage } = useStreamAIMessage();
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (!inputWrapperRef.current) return;

    // 根据 message 长度判断目标 margin
    const targetMarginTop =
      message.length > 0 ? "auto" : window.innerHeight * 0; // 20% 高度

    gsap.to(inputWrapperRef.current, {
      marginTop: targetMarginTop,
      duration: 0.5,
      ease: "power2.out",
    });
  }, [message.length]); // 监听 message 长度变化
  // 获取历史记录
  const getHisttoryList = async () => {
    const res = await getChatRecords({});
    if (res.data.success) {
      setChatList(res.data.data.chat_list as ChatItem[]);
    }
  };
  useEffect(() => {
    getHisttoryList();
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
      dispatch(setMessages(messagesWithType));
      setCurrentChatId(id);
      setPageLoading(false);
    } else {
      setPageLoading(false);
    }
  };

  // 发送消息（流式接收）
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    const result = await createChat({
      id: currentChatId ? currentChatId : Date.now(),
      message: inputValue,
    });

    if (result.data.success) {
      getHisttoryList();
      setCurrentChatId(result.data.data.chat_id);
      setSelectedMenuKey(result.data.data.chat_id.toString());

      // 用户消息
      dispatch(
        addMessage({
          id: result.data.data.id,
          sender: 0,
          content: inputValue,
        })
      );
      const messageToSend = inputValue;
      setInputValue("");
      // 流式消息
      await streamAIMessage(result.data.data.chat_id, messageToSend);
    }

    setLoading(false);
  };

  return (
    <Layout>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="h-screen p-[20px] !bg-base-200 overflow-y-auto border-r-[10px] border-base-300"
      >
        <EAMenu
          className="max-h-[calc(100vh-328px)] overflow-y-auto !bg-[#fff] !rounded-[10px]"
          chatList={chatList}
          handleChatClick={handleChatClick}
          selectedKey={selectedMenuKey}
          onSelectedKeyChange={setSelectedMenuKey}
        />
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: "16px", width: 64, height: 64 }}
        />
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
            dispatch(resetMessages());
            setCurrentChatId(null);
            setSelectedMenuKey(""); // 清空菜单选中
          }}
          className="mt-[auto]"
        />
        <EATheme />
      </Sider>
      <Layout>
        <Spin spinning={pageLoading}>
          <Content
            style={{
              padding: 24,
              minHeight: 280,
              overflow: "auto",
              height: "100vh",
            }}
            className="flex flex-col bg-base-200 justify-center gap-[20px] "
          >
            <div className="overflow-y-auto w-full">
              {message.map((item) => {
                return (
                  <div key={item.id} className="w-full flex flex-col mb-4">
                    {item.think_content && (
                      <div className="px-3 max-w-[80%] py-2 rounded-lg rounded-bl-none mt-2 bg-[var(--Ai-think-bg)] text-[var(--Ai-think-text)] text-sm italic">
                        <EAMarkdown
                          content={item.think_content}
                          showCursor={!item.finished && item.sender === 1}
                        />
                      </div>
                    )}
                    {item.content && (
                      <div
                        className={`px-4 py-2  max-w-[80%] leading-8 ${
                          item.sender === 0
                            ? "bg-blue-500 text-white rounded-lg ml-auto"
                            : "bg-[var(--Ai-content-bg)] rounded-lg rounded-tl-none text-[var(--Ai-content-text)] mr-auto"
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
              className="flex justify-center items-center w-full"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="!h-[46px] !w-[50%]"
              />
              <EAButton text="发送" onClick={handleSend} loading={loading} />
            </div>
          </Content>
        </Spin>
      </Layout>
    </Layout>
  );
};

export default Home;

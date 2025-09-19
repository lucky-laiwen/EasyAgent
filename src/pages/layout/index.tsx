import React, { useEffect, useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, Input } from "antd";
import { getChatRecords, getChatContent } from "@/api/chat";
import EAButton from "@/components/EAButton";
import { useNavigate } from "react-router-dom";
import { sendMessage } from "@/utils/chat";
import EAMenu from "@/components/EAMenu";
import EAMarkdown from "@/components/EAMarkdown";
const { Sider, Content } = Layout;

export interface ChatItem {
  id: number;
  sender: 0 | 1;
  content: string;
  title?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number>(0);

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

  // 切换指定内容
  const handleChatClick = async (id: number) => {
    const res = await getChatContent(id);
    if (res.data.success) {
      setCurrentChat(res.data.data as ChatItem[]);
      setCurrentChatId(id);
    }
  };

  // 发送消息（流式接收）
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatItem = {
      id: Date.now(),
      sender: 0,
      content: inputValue,
    };
    setCurrentChat((prev) => [...prev, userMessage]);

    const messageToSend = inputValue;
    setInputValue("");

    (async () => {
      const params = { id: currentChatId, message: messageToSend };

      // 占位 AI 消息
      const aiMessageId = Date.now() + 1;
      setCurrentChat((prev) => [
        ...prev,
        { id: aiMessageId, sender: 1, content: "" },
      ]);

      let stream = "";

      // 假设 sendMessage 返回 AsyncIterable<string>
      for await (const chunk of sendMessage(params) as AsyncIterable<string>) {
        stream += chunk;
        setCurrentChat((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, content: stream } : msg
          )
        );
      }
    })();
  };

  return (
    <Layout>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="h-screen p-[20px] !bg-base-200"
      >
        <EAMenu chatList={chatList} handleChatClick={handleChatClick} />
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
      </Sider>
      <Layout>
        <Content
          style={{
            margin: "16px",
            padding: 24,
            minHeight: 280,
            overflow: "auto",
            height: "calc(100vh - 128px)",
          }}
          className="flex flex-col"
        >
          {currentChat.map((item) => {
            const thinkMatch = item.content.match(/<think>([\s\S]*?)<\/think>/);
            const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
            const formalContent = item.content
              .replace(/<think>[\s\S]*?<\/think>/, "")
              .trim();

            return (
              <div key={item.id} className="w-full flex mb-2">
                <div
                  className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    item.sender === 0
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-200 text-black mr-auto"
                  }`}
                >
                  {thinkContent && (
                    <div className="px-3 py-2 rounded-lg bg-blue-100 text-blue-800 text-sm italic">
                      <EAMarkdown content={thinkContent} />
                    </div>
                  )}
                  {formalContent && <EAMarkdown content={formalContent} />}
                </div>
              </div>
            );
          })}

          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="!mt-[auto]"
          />
          <EAButton text="发送" onClick={handleSend} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Home;

import React, { useEffect, useRef, useState } from "react";
import { Layout, Spin, message, Avatar, Upload } from "antd";
import { getChatRecords, getChatContent, createChat } from "@/api/chat";
import { type UploadRequestOption } from "rc-upload/lib/interface";
import EAButton from "@/components/EAButton";
import EAInput from "@/components/EAInput";
import { useNavigate } from "react-router-dom";
import EAMenu from "@/components/EAMenu/index";
import EAMarkdown from "@/components/EAMarkdown/EAMarkdown";
import {
  addMessage,
  setMessages,
  useStore,
  setUser,
  updateUserChat,
  toggleChat,
  updateUserFriend,
  type ChatItem as ChatItemStore,
  updateUnReadMsg,
  updateAllChatMsg,
  updatedSocket,
} from "@/store/store";
import {
  getUnreadMessageList,
  getAllMessageList,
  createChatSocket,
} from "@/api/userChat";
import EATheme from "@/components/EAThema";
import { useStreamAIMessage } from "@/utils/stream";
import { logout, uploadFile, updateUserInfo } from "@/api/user";
import MenuFoldDark from "@/assets/menu-fold-dark.svg";
import MenuFoldLight from "@/assets/menu-fold-light.svg";
import EADrawer from "@/components/EADrawer";
import EAModal from "@/components/EAModal";
import NewChatLight from "@/assets/new-chat-light.svg";
import NewChatDark from "@/assets/new-chat-dark.svg";
import Logo from "@/assets/EasyAgent-Logo.svg";
import AiChatDark from "@/assets/ai-chat-dark.svg";
import AiChatLight from "@/assets/ai-chat-light.svg";
import { getFriendList } from "@/api/userFriend";
import EALoader from "@/components/EALoader";
import EAMessage from "@/components/EAMessage";
import EAActionBar from "@/components/EAActionBar";
const { Content } = Layout;
export interface ChatItem {
  id: number;
  sender: 0 | 1;
  content: string;
  title?: string;
  think_content?: string;
  type?: string;
  finished?: boolean;
  source?: "own" | "shared";
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { streamAIMessage } = useStreamAIMessage();
  const messages = useStore((state) => state.messages) ?? [];
  const unreadMsg = useStore((state) => state.unReadMsg);
  const actualTheme = useStore((state) => state.actualTheme);
  const userInfo = useStore((state) => state.user);
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
  const [slideHide, setSlideHide] = useState(true);
  const [currentMessage, setCurrentMessage] = useState<ChatItemStore>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(userInfo?.name);
  const [userEmail, setUserEmail] = useState<string | undefined>(
    userInfo?.email,
  );
  // 将对话聊天滚动到最底部
  const scrollToBottom = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight + 50,
      behavior: "auto",
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

    updatedSocket(createChatSocket(userInfo?.id as number));
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

  const getFriendListApi = async () => {
    const res = await getFriendList();
    updateUserFriend(res.data.data);
    const result = await getUnreadMessageList();
    if (result.data.success) {
      updateUnReadMsg(result.data.data);
    }
    const response = await getAllMessageList();
    if (response.data.success) {
      updateAllChatMsg(response.data.data);
    }
  };

  useEffect(() => {
    getFriendListApi();
  }, []);

  // 当 message 更新时自动滚动
  useEffect(() => {
    if (isUserAtBottom) scrollToBottom();
    if (messages[messages.length - 1]) {
      setLoading(!messages[messages.length - 1].finished || false);
    }
  }, [messages]);
  if (!localStorage.getItem("token")) {
    navigate("/login");
    return null;
  }

  // 切换指定内容
  const handleChatClick = async (id: number) => {
    setPageLoading(true);
    setCurrentMessage(undefined);
    const res = await getChatContent(id);
    if (res.data.success) {
      const messagesWithType = (res.data.data as ChatItem[]).map((item) => ({
        ...item,
        type: item.think_content ? "think" : "text",
        finished: true,
      }));
      setSelectedMenuKey(id.toString());
      setMessages(messagesWithType);
      setCurrentChatId(id);
      setPageLoading(false);
    } else {
      setPageLoading(false);
      handleNewChat();
      EAMessage.error("此聊天不存在");
      getHisttoryList();
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
    const chatId = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    setTimeout(scrollToBottom, 30);
    // 1. 创建聊天请求
    if (!currentChatId) {
      const result = await createChat({
        id: chatId,
        message: sendText,
      });
      if (result.data.success) {
        const chatId = result.data.data.id;
        setCurrentChatId(chatId);
        setSelectedMenuKey(chatId.toString());
        getHisttoryList();

        await streamAIMessage(chatId, sendText);
      }
    } else {
      getHisttoryList();
      await streamAIMessage(currentChatId, sendText);
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
        setCurrentChatId(null);
        navigate("/login");
      }, 1000);
    } else {
      messagesApi.error("logout failed");
    }
  };

  // 关闭下拉菜单
  const handleClose = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleUploadChange = async (option: UploadRequestOption<File>) => {
    try {
      const { file } = option;
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadFile(formData);

      if (userInfo?.id) {
        setUser({ ...userInfo, avatar: res.data.data.url });
      }
      const result = await updateUserInfo({
        name: userInfo?.name as string,
        avatar: res.data.data.url,
        email: userInfo?.email as string,
      });
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUserInfo = async () => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (userInfo?.name === userName && userInfo?.email === userEmail) {
      return;
    }
    if (!userName) {
      setUserName(userInfo?.name);
      EAMessage.error("名字不能为空");
      return;
    }
    if (!userEmail || !re.test(userEmail)) {
      setUserEmail(userInfo?.email);
      EAMessage.error("请正确填写邮箱");
      return;
    }
    const payload = {
      name: userName as string,
      avatar: userInfo?.avatar as string,
      email: userEmail as string,
    };
    const res = await updateUserInfo(payload);
    if (res.data.success) {
      setUser(res.data.data);
      EAMessage.success(res.data.message);
    } else {
      setUserEmail(userInfo?.email);
      setUserName(userInfo?.name);
    }
  };

  // 创建新会话
  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSelectedMenuKey("");
    handleClose();
    setCurrentMessage(undefined);
  };

  return (
    <div className="flex w-full h-screen overflow-hidden transition-all duration-300">
      {/* 左侧菜单栏 */}
      <div
        className={`
          flex flex-col border-base-300 flex-shrink-0
          transition-all duration-300 bg-base-300
          ${slideHide ? "w-[260px] opacity-100" : "w-0 opacity-0"}
        `}
      >
        <div className="flex flex-col gap-2 border-b-3 border-base-300 p-2 relative">
          <div className="flex flex-col justify-center gap-2">
            <div className="flex items-center gap-4 my-2 p-2 rounded-lg transition-all duration-300">
              <img src={Logo} className="w-[36px] h-[36px]" />
              <div>Easy-Agent</div>
            </div>
            <EAButton
              text="创建新会话"
              onClick={handleNewChat}
              icon={
                <img
                  src={actualTheme === "dark" ? AiChatDark : AiChatLight}
                  alt=""
                  className="w-4 h-4 text-white"
                />
              }
              className="flex justify-start bg-[transparent] rounded-lg border-none shadow-none hover:bg-[var(--Ai-think-bg)]"
            />
            <EATheme />
            <div className="relative">
              {unreadMsg.length > 0 && (
                <span
                  className="
                    absolute top-1/2 right-2 -translate-y-1/2
                    min-w-[18px] h-[18px]
                    px-1
                    flex items-center justify-center
                    rounded-full
                    bg-rose-500/90
                    text-[11px] font-medium text-white
                    shadow-sm
                  "
                >
                  {unreadMsg.length > 99 ? "99+" : unreadMsg.length}
                </span>
              )}

              <EAButton
                text="好友列表"
                onClick={() => {
                  toggleChat(true);
                  handleClose();
                  setCurrentMessage(undefined);
                }}
                icon={
                  <img
                    src={actualTheme === "dark" ? NewChatDark : NewChatLight}
                    alt=""
                    className="w-4 h-4 text-white"
                  />
                }
                className="flex w-full justify-start bg-[transparent] rounded-lg border-none shadow-none hover:bg-[var(--Ai-think-bg)]"
              />
            </div>
          </div>
        </div>
        {/* 让上半部分（EAMenu）自动占满剩余空间 */}
        <div className="flex-1 overflow-y-auto px-2">
          <EAMenu
            className="!bg-transparent"
            chatList={chatList}
            handleChatClick={handleChatClick}
            selectedKey={selectedMenuKey}
            onSelectedKeyChange={setSelectedMenuKey}
            getHisttoryList={getHisttoryList}
            deleteCurChat={() => setCurrentChatId(null)}
          />
        </div>

        {/* 固定底部操作区 */}
        <div
          onClick={() => {
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 p-4 transition-all duration-300 hover:bg-[var(--Ai-think-bg)] border-t-1 border-[var(--Ai-think-bg)] cursor-pointer"
        >
          <Avatar size={36} src={userInfo?.avatar} />
          <div className="text-[14px]">{userInfo?.name}</div>
        </div>
      </div>

      <Layout className={`w-[auto]`}>
        <Spin spinning={pageLoading}>
          <Content
            ref={divRef}
            className="flex flex-col p-6 justify-between h-screen overflow-auto bg-base-200 relative "
          >
            <div
              ref={messageContainerRef}
              className="overflow-y-auto w-[full] flex flex-col items-center gap-2"
            >
              <img
                src={actualTheme === "dark" ? MenuFoldLight : MenuFoldDark}
                alt=""
                className={`absolute top-[10px] left-[0%] cursor-pointer hover:bg-white/10 p-1 rounded-sm ${
                  slideHide ? "" : "rotate-180"
                }`}
                onClick={() => setSlideHide(!slideHide)}
              />

              {messages.map((item) => {
                return (
                  <div
                    key={item.id}
                    className={`w-[60%] max-w-[670px] flex flex-col mb-4  ${
                      item.sender === 0 ? "items-end" : "items-start"
                    }`}
                  >
                    {/* 思考内容 */}
                    {/* {item.think_content && (
                      <div className="px-3  w-[100%] py-2 rounded-lg rounded-bl-none rounded-br-none mt-2 bg-[var(--Ai-think-bg)] text-[var(--Ai-think-text)]">
                        <EAMarkdown
                          content={item.think_content}
                          isFinished={item.finished}
                        />
                      </div>
                    )} */}
                    {/* 工具名称 */}
                    {item.tool_name && (
                      <div
                        className="group relative flex items-center gap-3 p-4 my-2 w-[40%] rounded-2xl shadow-md 
                                  bg-gradient-to-r from-[var(--Ai-content-bg)]/90 to-[var(--Ai-content-bg)]/60 
                                  backdrop-blur-md border border-white/10 transition-all duration-300 
                                  hover:scale-[1.02] hover:shadow-lg hover:border-primary/40 cursor-pointer"
                        onClick={() => {
                          toggleChat(false);
                          setCurrentMessage(item);
                        }}
                      >
                        {/* 左侧图标区 */}
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-xl 
                                      bg-primary/20  text-lg"
                        >
                          🛠️
                        </div>

                        {/* 内容区 */}
                        <div className="flex flex-col text-[var(--Ai-content-text)] flex-1">
                          <div className="text-[15px] font-semibold tracking-wide">
                            {item.tool_name}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {item.finished ? "已完成" : "模型正在思考中"}
                          </p>
                        </div>

                        {/* 右侧加载区 */}
                        <div className="ml-auto flex items-center">
                          {!item.finished ? (
                            // 可以换成你喜欢的加载动画
                            <div className="w-4 h-4 border-2 border-t-primary border-gray-200 rounded-full animate-spin"></div>
                          ) : (
                            // 加载完成显示 ✓ 或其他图标
                            <div className="text-green-500 font-bold text-lg">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* 主要内容 */}
                    {item.content && (
                      <div
                        className={`leading-8 ${
                          item.sender !== 0 &&
                          "bg-[transparent] w-[100%] rounded-lg text-[var(--Ai-content-text)]"
                        }`} // <-- 关键
                      >
                        {item.sender === 1 ? (
                          <div className="flex flex-col gap-2">
                            <EAMarkdown
                              content={item.content}
                              isFinished={item.finished}
                            />
                            {item.finished && (
                              <EAActionBar content={item.content} />
                            )}
                          </div>
                        ) : (
                          <div className="group flex flex-col gap-2 items-end relative">
                            <div className="text-[var(--Ai-content-text)] px-4 py-2 msx-w-[100%] rounded-lg  bg-[var(--Ai-content-bg)] text-sm font-normal whitespace-pre-wrap">
                              {item.content}
                            </div>

                            <div className="absolute bottom-[-25px] right-0 opacity-0 group-hover:opacity-100 transition">
                              <EAActionBar
                                content={item.content}
                                onlyCopy={true}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="w-[60%] max-w-[670px] flex justify-start">
                {loading && <EALoader text="Generating" />}
              </div>
            </div>

            <div
              ref={inputWrapperRef}
              className={`flex flex-col justify-center items-center w-full translation-all duration-500 z-[9] transform-gpu relative ${
                messages.length > 0 ? "translate-y-[0%]" : "translate-y-[-35vh]"
              }`}
            >
              <button
                className={`fixed cursor-pointer top-[-30%] left-[65%] bg-base-300 text-[20px] text-[var(--Ai-content-text)] transition-opacity duration-300 rounded-full flex items-center justify-center rounded-full w-10 h-10 ${
                  !isUserAtBottom && messages.length > 0
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
                onClick={scrollToBottom}
              >
                ⮟
              </button>
              <EAInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                sendMessage={handleSend}
                loading={loading}
                className="w-[60%] max-w-[680px] mr-3"
              />
            </div>
          </Content>
        </Spin>
      </Layout>

      {/* 右侧菜单栏 */}
      <EADrawer
        message={currentMessage}
        handleClose={() => {
          updateUserChat([]);
          setCurrentMessage(undefined);
          toggleChat(false);
        }}
        getFriendListApi={getFriendListApi}
        handleChatClick={handleChatClick}
        chatList={chatList}
        getHistoryList={getHisttoryList}
      />

      <EAModal
        open={isModalOpen}
        title="菜单"
        onCancel={() => setIsModalOpen(false)}
        fotter={null}
      >
        {/* 个人信息部分 */}
        <div className="flex justify-between">
          <div className="flex items-center gap-4 mb-2">
            <Upload
              accept=".png,.jpg"
              customRequest={handleUploadChange}
              className="cursor-pointer"
              showUploadList={false}
            >
              <Avatar size={56} src={userInfo?.avatar} />
            </Upload>

            <div className="flex flex-col gap-[10px]">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={handleUserInfo}
                placeholder="Type here"
                className="input input-ghost w-[95%] !py-[10px] !px-0 text-lg h-5 hover:outline-[1px] focus:outline-[1px] transition-all duration-300"
              />
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onBlur={handleUserInfo}
                placeholder="Type here"
                className="input input-ghost w-[95%] !py-[10px] !px-0 text-sm text-gray-500 outline-[var(--color-base-content)] h-5 hover:outline-[1px] focus:outline-none transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <EAButton
              text="删除账号"
              onClick={() => {
                handleLogout();
                handleClose();
              }}
              className="bg-red-300 text-[red]"
              icon={
                <svg
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="6948"
                  width="18"
                  height="18"
                >
                  <path
                    d="M512 544c12.8 0 25.6-12.8 25.6-25.6V64c0-12.8-12.8-25.6-25.6-25.6s-25.6 12.8-25.6 25.6v448c0 19.2 12.8 32 25.6 32z m224-448c-51.2 6.4-25.6 44.8-25.6 44.8 134.4 70.4 224 211.2 224 371.2 0 230.4-185.6 422.4-422.4 422.4s-422.4-192-422.4-422.4c0-160 89.6-294.4 217.6-364.8 12.8-44.8-25.6-44.8-25.6-44.8C134.4 179.2 38.4 332.8 38.4 512c0 262.4 211.2 473.6 473.6 473.6 262.4 0 473.6-211.2 473.6-473.6 0-179.2-102.4-339.2-249.6-416z"
                    p-id="6949"
                    stroke="currentColor"
                    fill="var(--chat-text)"
                    strokeWidth={40}
                  ></path>
                </svg>
              }
            />
            <EAButton
              icon={
                <svg
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  p-id="5926"
                  width="18"
                  height="18"
                >
                  <g stroke="currentColor" fill="var(--chat-text)">
                    <path
                      d="M0 192v640c0 70.7 57.3 128 128 128h352c17.7 0 32-14.3 32-32s-14.3-32-32-32H128c-35.3 0-64-28.7-64-64V192c0-35.3 28.7-64 64-64h352c17.7 0 32-14.3 32-32s-14.3-32-32-32H128C57.3 64 0 121.3 0 192z"
                      p-id="5927"
                    ></path>
                    <path
                      d="M1013.3 488.3L650.9 160.7c-41.2-37.2-106.9-8-106.9 47.5V339c0 4.4-3.6 8-8 8H224c-17.7 0-32 14.3-32 32v266c0 17.7 14.3 32 32 32h312c4.4 0 8 3.6 8 8v130.9c0 55.5 65.8 84.7 106.9 47.5l362.4-327.6c14.1-12.8 14.1-34.8 0-47.5zM256 597V427c0-8.8 7.2-16 16-16h304c17.7 0 32-14.3 32-32V244.9c0-13.9 16.4-21.2 26.7-11.9L938 506.1c3.5 3.2 3.5 8.7 0 11.9L634.7 791c-10.3 9.3-26.7 2-26.7-11.9V645c0-17.7-14.3-32-32-32H272c-8.8 0-16-7.2-16-16z"
                      p-id="5928"
                    ></path>
                  </g>
                </svg>
              }
              text="退出登录"
              onClick={() => {
                showLoading();
                setTimeout(() => {
                  localStorage.removeItem("token");
                  updateUserChat([]);
                  updateUserFriend([]);
                  toggleChat(false);
                  setCurrentChatId(null);
                  setMessages([]);
                  setUser(null);
                  navigate("/login");
                }, 1000);
                handleClose();
              }}
            />
          </div>
        </div>
      </EAModal>
    </div>
  );
};

export default Home;

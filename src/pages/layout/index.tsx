import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Layout, Spin, message, Avatar, Upload, Image } from "antd";
import {
  getChatRecords,
  getChatContent,
  createChat,
  uploadChatFile,
} from "@/api/chat";
import { type UploadRequestOption } from "rc-upload/lib/interface";
import EAButton from "@/components/EAButton";
import EAInput from "@/components/EAInput";
import { useNavigate } from "react-router-dom";
import EAMenu from "@/components/EAMenu/index";
import EAMarkdown from "@/components/EAMarkdown/EAMarkdown";
import { Wrench, Check, Loader2, Search, Sun } from "lucide-react";
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
  updateMessage,
} from "@/store/store";
import {
  getUnreadMessageList,
  getAllMessageList,
  createChatSocket,
} from "@/api/userChat";
import EATheme from "@/components/EAThema";
import { useStreamAIMessage, useStreamPpt } from "@/utils/stream";
import { logout, uploadFile, updateUserInfo } from "@/api/user";
import EADrawer from "@/components/EADrawer";
import EAModal from "@/components/EAModal";
import {
  IconPresentation,
  IconFileText,
  IconDeleteUser,
  IconLogout,
  IconMenuFold,
  IconNewChat,
  IconLogoUrl,
  IconAiChat,
} from "@/assets/icons";
import { getFriendList } from "@/api/userFriend";
import EALoader from "@/components/EALoader";
import EAMessage from "@/components/EAMessage";
import EAActionBar from "@/components/EAActionBar";
import { getSystemInfoList } from "@/api/system_info";
import EAKnowledge from "@/components/EAKnowledge";
import KnowledgeModal from "@/components/EAKnowledge/KnowledgeModal";
import { getGlobalDocList, type DocItem } from "@/api/knowledge";
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
  const { streamAIMessage, stopStreaming } = useStreamAIMessage();
  const {
    streamOutline,
    confirmAndGenerate,
    stopStreaming: stopPptStreaming,
  } = useStreamPpt();

  const handleStopStreaming = useCallback(() => {
    stopStreaming();
    stopPptStreaming();
  }, [stopStreaming, stopPptStreaming]);
  const [pptOutlineMsgId, setPptOutlineMsgId] = useState<number | null>(null);
  const [pptOutlineBackendMsgId, setPptOutlineBackendMsgId] = useState<
    number | null
  >(null);
  const [pptConfirmLoading, setPptConfirmLoading] = useState(false);
  const [pptGenerating, setPptGenerating] = useState(false);
  const [pptRegenerating, setPptRegenerating] = useState(false);
  const messages = useStore((state) => state.messages) ?? [];
  const unreadMsg = useStore((state) => state.unReadMsg);
  const systemInfo = useStore((state) => state.systemInfo);
  const unReadCount =
    unreadMsg.length + systemInfo.filter((info) => info.is_read === 0).length;
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
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [slideHide, setSlideHide] = useState(true);
  const [inputMode, setInputMode] = useState<string>("text");
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
    null,
  );
  const [selectedToolCallId, setSelectedToolCallId] = useState<number | null>(
    null,
  );
  const [docList, setDocList] = useState<DocItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  // 文档列表更新时，清理已不存在的选中文档
  useEffect(() => {
    if (selectedDocIds.length === 0) return;
    const validIds = docList
      .filter((d) => d.status === "completed")
      .map((d) => d.id);
    const filtered = selectedDocIds.filter((id) => validIds.includes(id));
    if (filtered.length !== selectedDocIds.length) {
      setSelectedDocIds(filtered);
    }
  }, [docList]);
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; size: number }[]
  >([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      file_id: number;
      filename: string;
      file_type: string;
      file_size: number;
      file_url: string;
      text_content?: string | null;
    }[]
  >([]);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileModalContent, setFileModalContent] = useState<{
    filename: string;
    text_content: string;
  } | null>(null);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [knowledgeModalDocId, setKnowledgeModalDocId] = useState<number | null>(
    null,
  );
  const [knowledgeModalDocName, setKnowledgeModalDocName] = useState("");
  const [knowledgeModalSnippet, setKnowledgeModalSnippet] = useState("");
  const [knowledgeModalChunkIndex, setKnowledgeModalChunkIndex] = useState<number | undefined>();

  // 全局拖拽上传
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // 从 messages 数组中派生当前选中的消息，流式更新时自动同步
  const currentMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId),
    [messages, selectedMessageId],
  );

  // 当选中消息有 pending 大纲时，同步 pptOutlineMsgId
  useEffect(() => {
    if (
      currentMessage?.message_type === "ppt" &&
      currentMessage?.ppt_outline_status === "pending" &&
      currentMessage?.ppt_outline
    ) {
      setPptOutlineMsgId(currentMessage.id);
      setPptOutlineBackendMsgId(currentMessage.ppt_outline_message_id ?? null);
    }
  }, [currentMessage]);

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
    if (res.success) {
      setChatList(res.data.chat_list as ChatItem[]);
    }
  };
  // 获取工具图标
  const getToolIcon = (name: string) => {
    if (name.includes("web_search")) return <Search size={18} />;
    if (name.includes("weather_query")) return <Sun size={18} />;
    return <Wrench size={18} />;
  };

  // 获取工具显示名称
  const getToolDisplayName = (toolName: string) => {
    const nameMap: Record<string, string> = {
      web_search: "联网搜索",
      weather_query: "天气查询",
    };
    return nameMap[toolName] || toolName;
  };

  const getToolInputPreview = (toolInput: unknown) => {
    if (toolInput === null || toolInput === undefined) return "无参数";

    if (typeof toolInput === "string") {
      const trimmed = toolInput.trim();
      if (!trimmed) return "无参数";
      try {
        return JSON.stringify(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }

    try {
      return JSON.stringify(toolInput);
    } catch {
      return String(toolInput);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      hideLoading();
    }, 300);
    getHisttoryList();

    // 阻止浏览器默认打开拖入的文件
    const preventFileOpen = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventFileOpen);
    window.addEventListener("drop", preventFileOpen);
    getGlobalDocList().then((res) => {
      if (res.success) setDocList(res.data);
    });

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
      window.removeEventListener("dragover", preventFileOpen);
      window.removeEventListener("drop", preventFileOpen);
      clearTimeout(timer);
    };
  }, [hideLoading]);

  const getFriendListApi = async () => {
    const result = await getUnreadMessageList();
    if (result.success) {
      updateUnReadMsg(result.data);
    }
    const response = await getAllMessageList();
    if (response.success) {
      updateAllChatMsg(response.data);
    }
    const systemInfoRes = await getSystemInfoList();
    if (systemInfoRes.success) {
      useStore.setState({ systemInfo: systemInfoRes.data });
    }
    const res = await getFriendList();
    if (systemInfoRes.data) {
      updateUserFriend([
        ...res.data,
        {
          id: "system" as unknown as number,
          status: 0,
          created_at:
            (systemInfoRes.data ?? []).at(-1)?.created_at ??
            new Date().toISOString(),
          friend: {
            id: "system" as unknown as number,
            name: "系统消息",
            avatar: IconLogoUrl,
          },
        },
      ]);
    }
  };

  useEffect(() => {
    getFriendListApi();
  }, []);

  // 当 message 更新时自动滚动
  useEffect(() => {
    if (isUserAtBottom) scrollToBottom();
  }, [messages]);

  // 切换指定内容
  const handleChatClick = async (id: number) => {
    setPageLoading(true);
    setSelectedMessageId(null);
    setSelectedToolCallId(null);
    const res = await getChatContent(id);
    if (res.success) {
      const safeParse = (val: unknown) => {
        if (typeof val !== "string") return val;
        const trimmed = val.trim();
        if (!trimmed) return val;
        try {
          return JSON.parse(trimmed);
        } catch {
          return val;
        }
      };
      const messagesWithType = (res.data as ChatItemStore[]).map(
        (item) => {
          const base: any = {
            ...item,
            type: item.think_content ? "think" : "text",
            finished: true,
            tool_calls: item.tool_calls?.map((tc) => ({
              ...tc,
              tool_content: safeParse(tc.tool_content),
            })),
          };
          // PPT 历史消息保留 message_type
          if ((item as any).message_type === "ppt") {
            base.message_type = "ppt";
          }

          // 识别 ppt_outline 工具调用 → 恢复大纲
          const outlineTool = item.tool_calls?.find(
            (tc) => tc.tool_name === "ppt_outline",
          );
          if (outlineTool) {
            const outlineData = safeParse(outlineTool.tool_content);
            // 兼容两种数据结构：outline.slides 或直接 slides
            const slides = outlineData?.outline?.slides || outlineData?.slides;
            const style = outlineData?.outline?.style || outlineData?.style;
            if (slides) {
              base.ppt_outline = slides;
              base.ppt_style = style;
              // 使用消息 ID 而非工具调用 ID，后端需要消息 ID
              base.ppt_outline_message_id = item.id;
              base.message_type = "ppt";
              // status=2 表示待确认，否则为已确认
              if (outlineTool.status === 2) {
                base.ppt_outline_status = "pending";
              } else {
                base.ppt_outline_status = "confirmed";
              }
            }
          }

          // 识别 ppt 工具调用 → 恢复已生成的 PPT 幻灯片
          const pptTool = item.tool_calls?.find((tc) => tc.tool_name === "ppt");
          if (pptTool && pptTool.status === 1) {
            const pptData = safeParse(pptTool.tool_content);
            if (pptData?.slides) {
              base._pptSlidesData = pptData.slides;
              base._pptHasSlides = true;
              base.message_type = "ppt";
            }
          }

          return base;
        },
      );

      // 合并：将 ppt 幻灯片数据合并到对应的 outline 消息中
      for (let i = 0; i < messagesWithType.length; i++) {
        const msg = messagesWithType[i];
        if (msg._pptHasSlides && msg._pptSlidesData) {
          // 找到前一个有 ppt_outline 的消息
          for (let j = i - 1; j >= 0; j--) {
            const prevMsg = messagesWithType[j];
            if (prevMsg.ppt_outline && prevMsg.message_type === "ppt") {
              const slidesMap: Record<number, string> = {};
              const statusMap: Record<number, "done"> = {};
              msg._pptSlidesData.forEach((s: any) => {
                slidesMap[s.index] = s.html;
                statusMap[s.index] = "done";
              });
              prevMsg.ppt_slides = slidesMap;
              prevMsg.ppt_slide_status = statusMap;
              prevMsg.ppt_outline_status = "confirmed";
              // 标记当前消息不再显示 PPT 卡片
              msg._skipPptCard = true;
              break;
            }
          }
        }
        // 清理临时字段
        delete msg._pptSlidesData;
        delete msg._pptHasSlides;
      }

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

  // 拖入/选择文件后立即上传
  const handleFilesAdd = useCallback(
    async (files: File[]) => {
      // 去重：跳过已上传或正在上传的文件
      const existing = [
        ...uploadingFiles,
        ...uploadedFiles.map((f) => ({ name: f.filename, size: f.file_size })),
      ];
      const newFiles = files.filter(
        (f) => !existing.some((e) => e.name === f.name && e.size === f.size),
      );
      if (newFiles.length === 0) return;

      // 标记为上传中
      const uploading = newFiles.map((f) => ({ name: f.name, size: f.size }));
      setUploadingFiles((prev) => [...prev, ...uploading]);

      // 逐个上传
      for (const file of newFiles) {
        try {
          const res = await uploadChatFile(file);
          if (res.success) {
            setUploadedFiles((prev) => [...prev, res.data]);
          } else {
            EAMessage.error(`${file.name} 上传失败`);
          }
        } catch {
          EAMessage.error(`${file.name} 上传失败`);
        } finally {
          setUploadingFiles((prev) =>
            prev.filter((f) => !(f.name === file.name && f.size === file.size)),
          );
        }
      }
    },
    [uploadingFiles, uploadedFiles],
  );

  // 删除已上传的文件
  const handleFileRemove = useCallback((fileId: number) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file_id !== fileId));
  }, []);

  const refreshDocList = useCallback(() => {
    getGlobalDocList().then((res) => {
      if (res.success) setDocList(res.data);
    });
  }, []);

  // 全局拖拽上传
  const handlePageDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handlePageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handlePageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handlePageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      dragCounterRef.current = 0;
      if (e.dataTransfer.files.length > 0) {
        handleFilesAdd(Array.from(e.dataTransfer.files));
      }
    },
    [handleFilesAdd],
  );

  // 发送消息（流式接收）
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const sendText = inputValue;
    const sendMode = inputMode;
    const sendDocIds = selectedDocIds;
    const sendFileIds = uploadedFiles.map((f) => f.file_id);
    setInputValue("");
    setSelectedDocIds([]);
    setUploadedFiles([]);
    setLoading(true);

    // 插入用户信息
    addMessage({
      id: Date.now(),
      sender: 0,
      content: sendText,
      finished: true,
      rag_references:
        sendDocIds.length > 0
          ? sendDocIds
              .map((docId) => {
                const doc = docList.find((item) => item.id === docId);
                if (!doc) return null;
                return {
                  doc_id: doc.id,
                  filename: doc.filename,
                  file_type: doc.file_type,
                };
              })
              .filter(
                (
                  ref,
                ): ref is {
                  doc_id: number;
                  filename: string;
                  file_type: string;
                } => ref !== null,
              )
          : undefined,
      attachments:
        uploadedFiles.length > 0
          ? uploadedFiles.map((f) => ({
              id: f.file_id,
              filename: f.filename,
              file_type: f.file_type,
              file_size: f.file_size,
              file_url: f.file_url,
              text_content: f.text_content,
            }))
          : undefined,
    });

    // 获取 chatId（如果没有就用时间戳）
    const chatId = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    setTimeout(scrollToBottom, 30);
    try {
      // 1. 创建聊天请求
      if (!currentChatId) {
        const result = await createChat({
          id: chatId,
          message: sendText,
        });
        if (result.success) {
          const newChatId = result.data.id;
          setCurrentChatId(newChatId);
          setSelectedMenuKey(newChatId.toString());
          getHisttoryList();

          if (sendMode === "ppt") {
            const res = await streamOutline(
              newChatId,
              sendText,
              sendDocIds,
              sendFileIds,
            );
            setPptOutlineMsgId(res.aiMessageId);
            if (res.outlineMessageId) {
              setPptOutlineBackendMsgId(res.outlineMessageId);
            }
            // 大纲生成完成后打开侧边栏
            setSelectedMessageId(res.aiMessageId);
            setSelectedToolCallId(null);
          } else {
            await streamAIMessage(
              newChatId,
              sendText,
              sendMode,
              sendDocIds,
              sendFileIds,
            );
          }
        }
      } else {
        getHisttoryList();
        if (sendMode === "ppt") {
          const res = await streamOutline(
            currentChatId,
            sendText,
            sendDocIds,
            sendFileIds,
          );
          setPptOutlineMsgId(res.aiMessageId);
          if (res.outlineMessageId) {
            setPptOutlineBackendMsgId(res.outlineMessageId);
          }
          // 大纲生成完成后打开侧边栏
          setSelectedMessageId(res.aiMessageId);
          setSelectedToolCallId(null);
        } else {
          await streamAIMessage(
            currentChatId,
            sendText,
            sendMode,
            sendDocIds,
            sendFileIds,
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 注销账户
  const handleIconLogout = async () => {
    const res = await logout();
    if (res.success) {
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
        setUser({ ...userInfo, avatar: res.data.url });
      }
      const result = await updateUserInfo({
        name: userInfo?.name as string,
        avatar: res.data.url,
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
    if (res.success) {
      setUser(res.data);
      EAMessage.success(res.message);
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
    setSelectedMessageId(null);
    setSelectedToolCallId(null);
    setInputMode("text");
    setPptOutlineMsgId(null);
    setPptOutlineBackendMsgId(null);
  };

  // PPT 大纲确认生成
  const handleConfirmOutline = useCallback(
    async (outline: { style: any; slides: any[] }) => {
      if (!currentChatId || !pptOutlineMsgId) return;
      // Fallback: read backend message id from the store message object
      const effectiveBackendMsgId =
        pptOutlineBackendMsgId ??
        useStore.getState().messages?.find((m) => m.id === pptOutlineMsgId)
          ?.ppt_outline_message_id;
      if (!effectiveBackendMsgId) {
        EAMessage.error("无法获取大纲消息 ID，请重新生成");
        return;
      }
      setPptConfirmLoading(true);
      setPptGenerating(true);
      try {
        await confirmAndGenerate(
          currentChatId,
          pptOutlineMsgId,
          effectiveBackendMsgId,
          outline,
        );
      } catch (e: any) {
        EAMessage.error(e.message || "生成失败");
      } finally {
        setPptConfirmLoading(false);
        setPptGenerating(false);
        setPptOutlineMsgId(null);
        setPptOutlineBackendMsgId(null);
      }
    },
    [
      currentChatId,
      pptOutlineMsgId,
      pptOutlineBackendMsgId,
      confirmAndGenerate,
    ],
  );

  // PPT 大纲取消（重新生成）
  const handleCancelOutline = useCallback(() => {
    stopPptStreaming();
    // 重置大纲状态，允许重新生成
    if (pptOutlineMsgId) {
      updateMessage({
        id: pptOutlineMsgId,
        ppt_outline: undefined,
        ppt_style: undefined,
        ppt_outline_status: undefined,
        ppt_outline_message_id: undefined,
      });
    }
    setPptOutlineMsgId(null);
    setPptOutlineBackendMsgId(null);
  }, [pptOutlineMsgId, stopPptStreaming]);

  // PPT 大纲重新生成（只传 message_id，后端自行查询聊天 ID 和原始提示词）
  const handleRegenerateOutline = useCallback(async () => {
    if (!pptOutlineMsgId) return;
    setPptRegenerating(true);
    try {
      const res = await streamOutline(
        0,
        "",
        undefined,
        undefined,
        pptOutlineMsgId,
        pptOutlineBackendMsgId ?? undefined,
      );
      if (res.outlineMessageId) {
        setPptOutlineBackendMsgId(res.outlineMessageId);
      }
    } catch (e: any) {
      EAMessage.error(e.message || "重新生成失败");
    } finally {
      setPptRegenerating(false);
    }
  }, [pptOutlineMsgId, pptOutlineBackendMsgId, streamOutline]);

  const handleOpenKnowledgeModal = (docId: number, docName: string, snippet?: string, chunkIndex?: number) => {
    setKnowledgeModalDocId(docId);
    setKnowledgeModalDocName(docName);
    setKnowledgeModalSnippet(snippet ?? "");
    setKnowledgeModalChunkIndex(chunkIndex);
    setKnowledgeModalOpen(true);
  };

  if (!localStorage.getItem("token")) {
    navigate("/login");
    return null;
  }

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
              <img src={IconLogoUrl} className="w-[36px] h-[36px]" />
              <div>Easy-Agent</div>
            </div>
            <EAButton
              text="创建新会话"
              onClick={handleNewChat}
              icon={
                <IconAiChat className="w-4 h-4" />
              }
              className="flex justify-start bg-[transparent] rounded-lg border-none shadow-none hover:bg-[var(--Ai-think-bg)]"
            />
            <EATheme />
            <EAKnowledge onDocListChange={refreshDocList} />
            <div className="relative">
              {unReadCount > 0 && (
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
                  {unReadCount > 99 ? "99+" : unReadCount}
                </span>
              )}

              <EAButton
                text="好友列表"
                onClick={() => {
                  toggleChat(true);
                  handleClose();
                  setSelectedMessageId(null);
                  setSelectedToolCallId(null);
                }}
                icon={
                  <IconNewChat className="w-4 h-4" />
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
            className="flex flex-col p-6 justify-between h-screen overflow-auto bg-base-200 relative"
            onDragEnter={handlePageDragEnter}
            onDragLeave={handlePageDragLeave}
            onDragOver={handlePageDragOver}
            onDrop={handlePageDrop}
          >
            {isDragOver && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                style={{
                  backgroundColor: "var(--Ai-think-bg)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">📎</div>
                  <span
                    className="text-lg font-medium"
                    style={{ color: "var(--chat-text)" }}
                  >
                    松开即可上传文件
                  </span>
                </div>
              </div>
            )}
            <div
              ref={messageContainerRef}
              className="overflow-y-auto w-[full] flex flex-col items-center gap-2"
            >
              <IconMenuFold
                className={`w-7 h-7 absolute top-[5px] left-[0%] cursor-pointer hover:bg-white/10 p-1 rounded-sm ${
                  slideHide ? "" : "rotate-180"
                }`}
                style={{ color: "var(--chat-text)" }}
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
                    {item.think_content && (
                      <div className="px-3  w-[100%] py-2 rounded-lg rounded-bl-none rounded-br-none mt-2 bg-[var(--Ai-think-bg)] text-[var(--Ai-think-text)]">
                        <EAMarkdown
                          content={item.think_content}
                          isFinished={item.finished}
                        />
                      </div>
                    )}
                    {/* 工具调用卡片 */}

                    {item.tool_calls
                      ?.filter(
                        (tc) =>
                          tc.tool_name !== "ppt" &&
                          tc.tool_name !== "ppt_outline",
                      )
                      .map((toolCall) => (
                        <div
                          key={toolCall.id}
                          className={`
                          group relative flex items-center gap-3 p-3 my-3 rounded-2xl w-full
                          bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
                          border border-white/10
                          shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                          transition-all duration-300 cursor-pointer
                          hover:shadow-[0_10px_40px_rgba(0,0,0,0.18)]
                          hover:border-primary/40
                        `}
                          onClick={() => {
                            toggleChat(false);
                            setSelectedMessageId(item.id);
                            setSelectedToolCallId(toolCall.id);
                          }}
                        >
                          {/* 左侧图标 */}
                          <div
                            className="
                            flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl
                            bg-gradient-to-br from-primary/25 to-primary/5
                            text-primary
                          "
                          >
                            {getToolIcon(toolCall.tool_name)}
                          </div>

                          {/* 内容 */}
                          <div className="flex-1 min-w-0 text-[var(--Ai-content-text)]">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold tracking-wide truncate">
                                {getToolDisplayName(toolCall.tool_name)}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5 text-[var(--Ai-think-text)] truncate">
                              {getToolInputPreview(toolCall.tool_input)}
                            </p>
                          </div>

                          {/* 右侧状态 */}
                          <div className="flex-shrink-0 flex items-center">
                            {toolCall.status === 2 ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Loader2 className="animate-spin" size={12} />
                                思考中
                              </span>
                            ) : toolCall.status === 1 ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-400/10 text-green-400 text-xs font-medium">
                                <Check size={12} strokeWidth={3} />
                                完成
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-400/10 text-red-400 text-xs font-medium">
                                失败
                              </span>
                            )}
                          </div>

                          {/* hover 光效 */}
                          <div
                            className="
                            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                            bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_70%)]
                            transition-opacity duration-300 pointer-events-none
                          "
                          />
                        </div>
                      ))}
                    {/* PPT 大纲卡片 */}
                    {item.ppt_outline && (
                      <div
                        onClick={() => {
                          toggleChat(false);
                          setSelectedMessageId(item.id);
                          setSelectedToolCallId(null);
                        }}
                        className="group relative flex flex-col gap-2 p-4 my-2 rounded-2xl w-full cursor-pointer
                          bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
                          border border-white/10
                          shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                          transition-all duration-300
                          hover:shadow-[0_10px_40px_rgba(0,0,0,0.18)]
                          hover:border-primary/40"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary">
                            <IconPresentation className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-[var(--Ai-content-text)]">
                              PPT 演示
                            </span>
                            {item.ppt_outline && (
                              <span className="text-xs text-[var(--Ai-think-text)] ml-2">
                                {item.ppt_outline.length} 页幻灯片
                              </span>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex items-center">
                            {!item.ppt_outline ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Loader2 className="animate-spin" size={12} />
                                搜索中
                              </span>
                            ) : item.ppt_outline_status === "pending" ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-medium">
                                待确认
                              </span>
                            ) : item.ppt_outline_status === "generating" ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Loader2 className="animate-spin" size={12} />
                                生成中
                              </span>
                            ) : item.ppt_slide_status &&
                              Object.values(item.ppt_slide_status).every(
                                (s) => s === "done",
                              ) ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-400/10 text-green-400 text-xs font-medium">
                                <Check size={12} strokeWidth={3} />
                                完成
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Loader2 className="animate-spin" size={12} />
                                加载中
                              </span>
                            )}
                          </div>
                        </div>
                        {item.ppt_outline && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.ppt_outline.slice(0, 5).map((s) => (
                              <span
                                key={s.index}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--Ai-think-text)]"
                              >
                                {s.title}
                              </span>
                            ))}
                            {item.ppt_outline.length > 5 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--Ai-think-text)]">
                                +{item.ppt_outline.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_70%)] transition-opacity duration-300 pointer-events-none" />
                      </div>
                    )}

                    {/* 主要内容 */}
                    {item.rag_references && item.rag_references.length > 0 && (
                      <div className="w-full mb-2">
                        <div
                          className={`text-[12px] text-[var(--Ai-think-text)] mb-2 ${
                            item.sender === 0 ? "text-right" : "text-left"
                          }`}
                        >
                          参考知识库
                        </div>
                        <div
                          className={`flex flex-wrap gap-2 ${
                            item.sender === 0 ? "justify-end" : "justify-start"
                          }`}
                        >
                          {item.rag_references.map((ref, index) => (
                            <button
                              key={`${ref.doc_id}-${ref.chunk_index ?? "na"}-${index}`}
                              className="group flex items-center gap-2 px-2 py-1.5 rounded-xl text-left transition-opacity hover:opacity-80 cursor-pointer"
                              style={{
                                backgroundColor: "var(--chat-tag-bg)",
                                border: "1.5px solid var(--chat-tag-border)",
                              }}
                              title={ref.snippet || ref.filename}
                              onClick={() =>
                                handleOpenKnowledgeModal(
                                  ref.doc_id,
                                  ref.filename,
                                  ref.snippet,
                                  ref.chunk_index,
                                )
                              }
                            >
                              <div
                                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-[11px] font-bold"
                                style={{
                                  backgroundColor: "var(--Ai-think-bg)",
                                  color: "var(--chat-text)",
                                }}
                              >
                                KB
                              </div>
                              <div className="flex flex-col min-w-0 leading-tight">
                                <span className="text-[12px] text-[var(--chat-text)] truncate max-w-[220px]">
                                  {ref.filename}
                                </span>
                                <span className="text-[11px] text-[var(--Ai-think-text)] truncate max-w-[220px]">
                                  {ref.chunk_index !== undefined
                                    ? `Chunk #${ref.chunk_index}`
                                    : "知识库文档"}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                            {item.finished &&
                              !(
                                item.message_type === "ppt" &&
                                item.ppt_outline_status === "generating"
                              ) && <EAActionBar content={item.content} />}
                          </div>
                        ) : (
                          <div className="group flex flex-col gap-2 items-end relative">
                            {/* 附件展示 */}
                            {item.attachments &&
                              item.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-end">
                                  {item.attachments.map((att) => {
                                    const isImage = [
                                      "jpg",
                                      "jpeg",
                                      "png",
                                      "webp",
                                    ].includes(att.file_type.toLowerCase());
                                    const formatSize = (bytes: number) => {
                                      if (bytes < 1024) return `${bytes}B`;
                                      if (bytes < 1024 * 1024)
                                        return `${(bytes / 1024).toFixed(1)}KB`;
                                      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
                                    };
                                    if (isImage) {
                                      return (
                                        <div
                                          key={att.id}
                                          className="rounded-xl overflow-hidden"
                                          style={{
                                            border:
                                              "1.5px solid var(--chat-tag-border)",
                                            maxWidth: 120,
                                            maxHeight: 120,
                                          }}
                                        >
                                          <Image
                                            src={att.file_url}
                                            alt={att.filename}
                                            style={{
                                              display: "block",
                                              maxWidth: 120,
                                              maxHeight: 120,
                                              width: "auto",
                                              height: "auto",
                                              objectFit: "contain",
                                            }}
                                            preview={{ mask: null }}
                                          />
                                        </div>
                                      );
                                    }
                                    const hasTextContent = !!att.text_content;
                                    return (
                                      <div
                                        key={att.id}
                                        className={`flex items-center gap-1.5 px-2 py-2 rounded-xl ${hasTextContent ? "cursor-pointer hover:opacity-80" : ""}`}
                                        style={{
                                          backgroundColor: "var(--chat-tag-bg)",
                                          border:
                                            "1.5px solid var(--chat-tag-border)",
                                        }}
                                        onClick={
                                          hasTextContent
                                            ? () => {
                                                setFileModalContent({
                                                  filename: att.filename,
                                                  text_content:
                                                    att.text_content!,
                                                });
                                                setFileModalOpen(true);
                                              }
                                            : undefined
                                        }
                                      >
                                        <div
                                          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg"
                                          style={{
                                            backgroundColor:
                                              "var(--Ai-think-bg)",
                                          }}
                                        >
                                          <IconFileText className="w-[18px] h-[18px]" />
                                        </div>
                                        <div className="flex flex-col gap-1.5 min-w-0 leading-tight">
                                          <span className="text-[12px] max-w-[180px] text-[var(--chat-text)] leading-none">
                                            {att.filename}
                                          </span>
                                          <span className="text-[11px] text-[var(--Ai-think-text)] leading-none">
                                            {att.file_type.toUpperCase()}{" "}
                                            {formatSize(att.file_size)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            <div className="text-[var(--Ai-content-text)] px-4 py-2 max-w-[100%] rounded-lg bg-[var(--Ai-content-bg)] text-sm font-normal whitespace-pre-wrap">
                              {item.content}
                            </div>

                            <div className="absolute bottom-[-25px] right-0 opacity-0 group-hover:opacity-100 transition">
                              {item.finished && (
                                <EAActionBar
                                  content={item.content}
                                  onlyCopy={true}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* AI消息流式生成中显示加载动画 */}
                    {item.sender === 1 && !item.finished && loading && (
                      <div className="w-[60%] max-w-[670px] flex justify-start">
                        <EALoader text="正在生成回复..." />
                      </div>
                    )}
                    {item.sender === 1 &&
                      item.ppt_outline_status === "generating" &&
                      pptGenerating && (
                        <div className="w-[60%] max-w-[670px] flex justify-start">
                          <EALoader text="正在生成PPT..." />
                        </div>
                      )}
                    {item.sender === 1 && pptRegenerating && (
                      <div className="w-[60%] max-w-[670px] flex justify-start">
                        <EALoader text="正在重新生成大纲..." />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* 用户发送消息后立即显示加载动画（AI消息尚未创建时） */}
              {loading &&
                messages.length > 0 &&
                messages[messages.length - 1].sender === 0 && (
                  <div className="w-[60%] max-w-[670px] flex justify-start">
                    <EALoader
                      text={inputMode === "ppt" ? "正在生成大纲..." : "正在思考..."}
                    />
                  </div>
                )}
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
                loading={loading || pptGenerating || pptRegenerating}
                onStop={handleStopStreaming}
                className="w-[60%] max-w-[680px] mr-3"
                mode={inputMode}
                setMode={setInputMode}
                docList={docList}
                selectedDocIds={selectedDocIds}
                setSelectedDocIds={setSelectedDocIds}
                uploadingFiles={uploadingFiles}
                uploadedFiles={uploadedFiles}
                onFilesAdd={handleFilesAdd}
                onFileRemove={handleFileRemove}
              />
            </div>
          </Content>
        </Spin>
      </Layout>

      {/* 右侧菜单栏 */}
      <EADrawer
        message={currentMessage}
        selectedToolCallId={selectedToolCallId}
        handleClose={() => {
          updateUserChat([]);
          setSelectedMessageId(null);
          setSelectedToolCallId(null);
          toggleChat(false);
        }}
        getFriendListApi={getFriendListApi}
        handleChatClick={handleChatClick}
        chatList={chatList}
        getHistoryList={getHisttoryList}
        onConfirmOutline={handleConfirmOutline}
        onCancelOutline={handleCancelOutline}
        onRegenerateOutline={handleRegenerateOutline}
        confirmOutlineLoading={pptConfirmLoading}
        regenerating={pptRegenerating}
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
                handleIconLogout();
                handleClose();
              }}
              className="bg-red-300 text-[red]"
              icon={<IconDeleteUser className="w-[18px] h-[18px]" />}
            />
            <EAButton
              icon={<IconLogout className="w-[18px] h-[18px]" />}
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

      <EAModal
        open={fileModalOpen}
        title={fileModalContent?.filename || "文件内容"}
        onCancel={() => {
          setFileModalOpen(false);
          setFileModalContent(null);
        }}
        className="!w-[40%]"
      >
        <div
          className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm"
          style={{ color: "var(--chat-text)" }}
        >
          {fileModalContent?.text_content}
        </div>
      </EAModal>

      <KnowledgeModal
        open={knowledgeModalOpen}
        docId={knowledgeModalDocId}
        docName={knowledgeModalDocName}
        snippet={knowledgeModalSnippet}
        chunkIndex={knowledgeModalChunkIndex}
        onClose={() => {
          setKnowledgeModalOpen(false);
          setKnowledgeModalDocId(null);
          setKnowledgeModalDocName("");
          setKnowledgeModalSnippet("");
          setKnowledgeModalChunkIndex(undefined);
        }}
        onDeleted={refreshDocList}
      />
    </div>
  );
};

export default Home;

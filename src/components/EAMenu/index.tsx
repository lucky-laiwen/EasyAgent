import { Dropdown, Input, Tooltip } from "antd";
import { EllipsisOutlined, ShareAltOutlined } from "@ant-design/icons";
import { useState } from "react";
import styles from "./index.module.scss";
import { type ChatItem } from "@/pages/layout";
import { updateChatTitle, deleteChat, unShareChat } from "@/api/chat";
import EAModal from "../EAModal";
import EAButton from "../EAButton";
import { setMessages } from "@/store/store";
import EAMessage from "../EAMessage";

interface EAMenuProps {
  chatList: ChatItem[];
  handleChatClick: (id: number) => void;
  className?: string;
  selectedKey?: string;
  onSelectedKeyChange?: (key: string) => void;
  getHisttoryList?: () => void;
  deleteCurChat?: () => void;
}

const EAMenu: React.FC<EAMenuProps> = ({
  chatList,
  handleChatClick,
  className,
  selectedKey,
  onSelectedKeyChange,
  getHisttoryList,
  deleteCurChat,
}) => {
  const [isOpen, setIsOpen] = useState<
    "rename" | "delete" | "unshare" | undefined
  >();
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  /** 重命名 */
  const handleRename = async (id: number) => {
    setIsLoading(true);
    const res = await updateChatTitle({ id, message: inputText });
    if (res.data.success) {
      getHisttoryList?.();
      setInputText("");
      setIsOpen(undefined);
    }
    setIsLoading(false);
  };

  /** 删除 */
  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const res = await deleteChat(id);
    if (res.data.success) {
      if (selectedKey === id.toString()) {
        setMessages([]);
        deleteCurChat?.();
        onSelectedKeyChange?.("");
      }
      EAMessage.success("删除成功");
      getHisttoryList?.();
      setIsOpen(undefined);
    }
    setIsLoading(false);
  };

  // 取消分享
  const handleUnshare = async (id: number) => {
    setIsLoading(true);
    const res = await unShareChat(id);
    if (res.data.success) {
      if (selectedKey === id.toString()) {
        setMessages([]);
        deleteCurChat?.();
        onSelectedKeyChange?.("");
      }
      EAMessage.success("取消分享成功");
      getHisttoryList?.();
      setIsOpen(undefined);
    }
    setIsLoading(false);
  };

  /** 拖拽开始 */
  const handleDragStart = (e: React.DragEvent, item: ChatItem) => {
    e.stopPropagation();
    e.dataTransfer.setData(
      "application/chat",
      JSON.stringify({
        id: item.id,
        title: item.title,
      }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className={`${className} ${styles.menu}`}>
      {/* 分组标题 */}
      <div className="px-3 py-2 text-xs text-gray-400">聊天</div>

      {/* 聊天列表 */}
      <div className="flex flex-col gap-1">
        {chatList.map((item) => {
          const active = selectedKey === item.id.toString();

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => {
                if (!active) {
                  handleChatClick(item.id);
                }
              }}
              className={`
                flex items-center justify-between
                pl-6 pr-3 py-2 rounded-lg cursor-pointer group
                ${active ? "bg-[var(--Ai-think-bg)]" : "hover:bg-[var(--Ai-think-bg)]"}
              `}
            >
              {/* 左侧：分享标识 + 标题 */}
              <div className="flex items-center gap-2 min-w-0">
                {item.source === "shared" && (
                  <Tooltip title="已分享">
                    <ShareAltOutlined className="text-xs text-gray-400 flex-shrink-0" />
                  </Tooltip>
                )}

                <span className="truncate text-sm">{item.title}</span>
              </div>

              {/* 右侧菜单 */}
              <Dropdown
                trigger={["click"]}
                menu={{
                  items:
                    item.source !== "shared"
                      ? [
                          { key: "rename", label: "重命名" },
                          { key: "delete", label: "删除" },
                        ]
                      : [
                          { key: "unshare", label: "取消分享" }, // 示例：如果是分享的聊天，可以有取消分享选项
                        ],
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                    setCurrentChatId(item.id);
                    setInputText(item.title ?? "");
                    setIsOpen(info.key as "rename" | "delete" | "unshare");
                  },
                }}
              >
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EllipsisOutlined />
                </div>
              </Dropdown>
            </div>
          );
        })}
      </div>

      {/* 重命名弹窗 */}
      <EAModal
        open={isOpen === "rename"}
        className="!w-[20%]"
        title="重命名"
        onCancel={() => setIsOpen(undefined)}
        fotter={
          <div className="flex justify-end gap-[20px]">
            <EAButton text="取消" onClick={() => setIsOpen(undefined)} />
            <EAButton
              text="确认"
              onClick={() => handleRename(currentChatId ?? 0)}
              loading={isLoading}
            />
          </div>
        }
      >
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={15}
          autoFocus
        />
      </EAModal>

      {/* 删除弹窗 */}
      <EAModal
        open={isOpen === "delete"}
        className="!w-[20%]"
        title="删除聊天？"
        onCancel={() => setIsOpen(undefined)}
        fotter={null}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[16px] font-bold">这会删除聊天 “{inputText}”？</p>
          <div className="flex justify-end gap-4">
            <EAButton
              text="确认"
              onClick={() => handleDelete(currentChatId!)}
              loading={isLoading}
            />
            <EAButton text="取消" onClick={() => setIsOpen(undefined)} />
          </div>
        </div>
      </EAModal>

      {/* 取消分享弹窗 */}
      <EAModal
        open={isOpen === "unshare"}
        className="!w-[20%]"
        title="取消分享？"
        onCancel={() => setIsOpen(undefined)}
        fotter={null}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[16px] font-bold">不再接受分享 “{inputText}”？</p>
          <div className="flex justify-end gap-4">
            <EAButton
              text="确认"
              onClick={() => handleUnshare(currentChatId!)}
              loading={isLoading}
            />
            <EAButton text="取消" onClick={() => setIsOpen(undefined)} />
          </div>
        </div>
      </EAModal>
    </div>
  );
};

export default EAMenu;

import { Menu, Dropdown, Input } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import styles from "./index.module.scss";
import { type ChatItem } from "@/pages/layout";
import { updateChatTitle, deleteChat } from "@/api/chat";
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
}
const EAMenu: React.FC<EAMenuProps> = ({
  chatList,
  handleChatClick,
  className,
  selectedKey,
  onSelectedKeyChange,
  getHisttoryList,
}) => {
  const [menuItems, setMenuItems] = useState<
    {
      key: number;
      label: React.ReactNode;
      type: "group";
      children: { key: number; label: React.ReactNode }[];
    }[]
  >([]);
  const [isOpen, setIsOpen] = useState<"rename" | "delete" | undefined>();
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const handleRename = async (id: number) => {
    setIsLoading(true);
    const res = await updateChatTitle({ id, message: inputText });
    if (res.data.success) {
      getHisttoryList?.();
      setIsOpen("rename");
      setInputText("");
      setIsOpen(undefined);
      setIsLoading(false);
    }
  };
  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const res = await deleteChat(id);
    if (res.data.success) {
      if (selectedKey === id.toString()) {
        setMessages([]);
      }
      EAMessage.success("删除成功");
      setIsLoading(false);
      setIsOpen(undefined);
      getHisttoryList?.();
    }
  };
  const footer = () => {
    return (
      <div className="flex justify-end gap-[20px]">
        <EAButton text="取消" onClick={() => setIsOpen(undefined)} />
        <EAButton
          text="确认"
          onClick={() => handleRename(currentChatId ?? 0)}
          loading={isLoading}
        />
      </div>
    );
  };

  useEffect(() => {
    setMenuItems([
      {
        key: 1,
        type: "group",
        label: "聊天",
        children: chatList.map((item) => ({
          key: item.id,
          label: (
            <div className="flex flex-shrink-0 justify-between items-center w-full group">
              <span className="truncate">{item.title}</span>
              <Dropdown
                menu={{
                  items: [
                    { key: "rename", label: "重命名" },
                    { key: "delete", label: "删除" },
                  ],
                  onClick: async (info) => {
                    info.domEvent.stopPropagation();
                    setCurrentChatId(item.id);
                    if (info.key === "rename") {
                      setInputText(item.title ?? "");
                      setIsOpen("rename");
                    } else if (info.key === "delete") {
                      setIsOpen("delete");
                      setInputText(item.title ?? "");
                    }
                  },
                }}
                trigger={["click"]}
              >
                <div
                  className="opacity-0 group-hover:opacity-100 !bg-[transparent] !border-none !text-[var(--chat-text)] !shadow-none transition-opacity duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EllipsisOutlined />
                </div>
              </Dropdown>
            </div>
          ),
        })),
      },
    ]);
  }, [chatList, getHisttoryList, selectedKey]);

  const handleClick = (e: { key: string }) => {
    if (e.key === selectedKey) return;
    handleChatClick(Number(e.key));
    onSelectedKeyChange?.(e.key);
  };

  return (
    <div>
      <Menu
        items={menuItems}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onClick={handleClick}
        className={`${className} ${styles.menu}`}
      />
      <EAModal
        open={isOpen === "rename"}
        className="!w-[20%]"
        title="重命名"
        onCancel={() => setIsOpen(undefined)}
        fotter={footer()}
      >
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={15}
          autoFocus={isOpen === "rename"}
        />
      </EAModal>

      <EAModal
        open={isOpen === "delete"}
        className="!w-[20%]"
        title="删除聊天？"
        onCancel={() => setIsOpen(undefined)}
        fotter={null}
      >
        <div className="flex flex-col  h-full gap-[20px]">
          <p className="text-[16px] font-bold">这会删除聊天"{inputText}"？</p>
          <div className="flex gap-4 items-center justify-end">
            <EAButton
              text="确认"
              onClick={() => handleDelete(currentChatId as number)}
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

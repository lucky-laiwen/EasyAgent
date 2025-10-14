import { Menu, Dropdown, Input } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import styles from "./index.module.scss";
import { type ChatItem } from "@/pages/layout";
import { updateChatTitle, deleteChat } from "@/api/chat";
import EAModal from "../EAModal";
import EAButton from "../EAButton";
import { setMessages } from "@/store/store";
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
    { key: number; label: React.ReactNode }[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const handleRename = async (id: number) => {
    setIsLoading(true);
    const res = await updateChatTitle({ id, message: inputText });
    if (res.data.success) {
      getHisttoryList?.();
      setIsOpen(false);
      setInputText("");
    }
    setIsLoading(false);
  };
  const footer = () => {
    return (
      <div className="flex justify-end gap-[20px] mt-[20px]">
        <EAButton text="取消" onClick={() => setIsOpen(false)} />
        <EAButton
          text="确认"
          onClick={() => handleRename(currentChatId ?? 0)}
          loading={isLoading}
        />
      </div>
    );
  };

  useEffect(() => {
    setMenuItems(
      chatList.map((item) => ({
        key: item.id,
        label: (
          <div className="flex justify-between items-center w-full group">
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
                    setIsOpen(true);
                  } else if (info.key === "delete") {
                    const res = await deleteChat(item.id);
                    if (res.data.success) {
                      if (selectedKey === item.id.toString()) {
                        setMessages([]);
                      }
                      getHisttoryList?.();
                    }
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
      }))
    );
  }, [chatList, getHisttoryList]);

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
        open={isOpen}
        className=""
        title="重命名"
        onCancel={() => setIsOpen(false)}
        fotter={footer()}
      >
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={15}
        />
      </EAModal>
    </div>
  );
};

export default EAMenu;

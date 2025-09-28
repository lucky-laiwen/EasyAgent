import { Menu } from "antd";
import { type ChatItem } from "@/pages/layout";
import { useEffect, useState } from "react";
import styles from "./index.module.scss";

interface EAMenuProps {
  chatList: ChatItem[];
  handleChatClick: (id: number) => void;
  className?: string;
  selectedKey?: string; // 父组件控制选中
  onSelectedKeyChange?: (key: string) => void; // 父组件更新选中回调
}

const EAMenu: React.FC<EAMenuProps> = ({
  chatList,
  handleChatClick,
  className,
  selectedKey,
  onSelectedKeyChange,
}) => {
  const [menuItems, setMenuItems] = useState<
    { key: number; label: string | undefined }[]
  >([]);

  // 根据 chatList 更新菜单项
  useEffect(() => {
    setMenuItems(chatList.map((item) => ({ key: item.id, label: item.title })));
  }, [chatList]);

  // 点击菜单项
  const handleClick = (e: { key: string }) => {
    if (e.key === selectedKey) return;
    handleChatClick(Number(e.key));
    onSelectedKeyChange?.(e.key); // 通知父组件更新选中
  };

  return (
    <Menu
      items={menuItems}
      selectedKeys={selectedKey ? [selectedKey] : []} // 如果没有选中项则为空数组
      onClick={handleClick}
      className={`${className} ${styles.menu}`}
    />
  );
};

export default EAMenu;

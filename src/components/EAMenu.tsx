import { Menu } from "antd";
import { type ChatItem } from "@/pages/layout";
import { useEffect, useState } from "react";

interface EAMenuProps {
  chatList: ChatItem[];
  handleChatClick: (id: number) => void;
}

const EAMenu: React.FC<EAMenuProps> = ({ chatList, handleChatClick }) => {
  const [menuItems, setMenuItems] = useState<
    { key: number; label: string | undefined }[]
  >([]);
  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => {
    setMenuItems(chatList.map((item) => ({ key: item.id, label: item.title })));
  }, [chatList]);

  const handleClick = (e: { key: string }) => {
    if (e.key === selectedKey) {
      return;
    }
    setSelectedKey(e.key);
    handleChatClick(Number(e.key));
  };

  return (
    <Menu
      items={menuItems}
      selectedKeys={[selectedKey]}
      onClick={handleClick}
    />
  );
};

export default EAMenu;

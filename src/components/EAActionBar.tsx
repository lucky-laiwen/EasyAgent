import { useState } from "react";
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  CopyOutlined,
  CheckOutlined,
} from "@ant-design/icons";

interface EAActionBarProps {
  content?: string; // 用于复制
  onlyCopy?: boolean; // 是否只显示复制按钮
}

const EAActionBar = ({ content = "", onlyCopy = false }: EAActionBarProps) => {
  const [action, setAction] = useState<"like" | "dislike" | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const iconClass =
    "text-gray-400 hover:text-gray-700 cursor-pointer transition-colors";

  const activeClass = "text-blue-500";

  return (
    <div className="flex items-center gap-3 text-base select-none">
      {!onlyCopy && (
        <>
          {/* 👍 Like */}
          <span
            className={`${iconClass} ${action === "like" ? activeClass : ""}`}
            title="点赞"
            onClick={() => setAction(action === "like" ? null : "like")}
          >
            {action === "like" ? <LikeFilled /> : <LikeOutlined />}
          </span>
          {/* 👎 Dislike */}
          <span
            className={`${iconClass} ${
              action === "dislike" ? activeClass : ""
            }`}
            title="踩"
            onClick={() => setAction(action === "dislike" ? null : "dislike")}
          >
            {action === "dislike" ? <DislikeFilled /> : <DislikeOutlined />}
          </span>
        </>
      )}

      {/* 📋 Copy */}
      <span className={`${iconClass}`} title="复制" onClick={handleCopy}>
        {copied ? <CheckOutlined /> : <CopyOutlined />}
      </span>
    </div>
  );
};

export default EAActionBar;

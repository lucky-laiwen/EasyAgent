import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "./index.module.scss";
import { useSelector } from "react-redux";
import { type RootState } from "@/store";
const EAMarkdown: React.FC<{
  content?: string;
  showCursor?: boolean;
  className?: string;
}> = ({ content, showCursor, className }) => {
  const [copied, setCopied] = useState(false);
  const theme = useSelector((state: RootState) => state.theme.theme);
  return (
    <span className={`${showCursor ? styles["with-cursor"] : ""} ${className}`}>
      <ReactMarkdown
        components={{
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            const handleCopy = () => {
              navigator.clipboard
                .writeText(codeString)
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                })
                .catch((err) => console.error("复制失败:", err));
            };

            return !inline && match ? (
              <div className="relative group my-2">
                {/* 包裹层，保证 sticky 生效 */}
                <div className="absolute w-full h-[calc(100%)] flex justify-between pt-[0px]">
                  {/* 生成的语言 */}
                  <div className="sticky flex items-center justify-between top-0 w-full h-[40px] rounded-tl-lg rounded-tr-lg bg-[var(--markdown-head-bg)] px-4">
                    <div className="text-[var(--Ai-content-text)]">
                      {match[1]}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="btn btn-xs btn-outline text-[var(--Ai-content-text)]"
                    >
                      {copied ? "✅ 已复制" : "复制"}
                    </button>
                  </div>
                </div>

                {/* 代码框 */}
                <SyntaxHighlighter
                  style={
                    theme === "light" ? (oneLight as any) : (oneDark as any)
                  }
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg !pt-[50px]"
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="px-1 py-0.5 bg-[var(--Ai-think-bg)] rounded text-sm">
                {children}
              </code>
            );
          },

          text({ ...props }) {
            return <span className="leading-[20px]">{props.children}</span>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </span>
  );
};

export default EAMarkdown;

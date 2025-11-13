import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useStore } from "@/store/store";
import remarkGfm from "remark-gfm";
// 单独组件，处理每个代码块
const CodeBlock: React.FC<{ language: string; value: string }> = ({
  language,
  value,
}) => {
  const theme = useStore((state) => state.theme);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch((err) => console.error("复制失败:", err));
  };

  return (
    <div className="relative group my-2">
      <div className="sticky top-0 w-full flex justify-between">
        <div className="flex items-center justify-between w-full h-[40px] rounded-tl-lg rounded-tr-lg bg-[var(--markdown-head-bg)] px-4">
          <div className="text-[var(--Ai-content-text)]">{language}</div>
          <button
            onClick={handleCopy}
            className="btn btn-xs btn-outline text-[var(--Ai-content-text)]"
          >
            {copied ? "✅ 已复制" : "复制"}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        style={theme === "light" ? oneLight : oneDark}
        language={language}
        PreTag="div"
        className="rounded-lg !m-0"
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const EAMarkdown: React.FC<{
  content?: string;
  showCursor?: boolean;
  className?: string;
}> = ({ content }) => {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            return !inline && match ? (
              <CodeBlock language={match[1]} value={codeString} />
            ) : (
              <code className="px-1 py-0.5 bg-[var(--Ai-think-bg)] rounded text-sm">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: (props) => (
            <th
              className="border border-gray-200 px-3 py-2 text-left font-medium bg-[var(--Ai-think-bg)]"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border border-gray-200 px-3 py-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default EAMarkdown;

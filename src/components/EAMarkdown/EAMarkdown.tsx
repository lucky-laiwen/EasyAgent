import React, { useEffect, useState } from "react";
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
  const actualTheme = useStore((state) => state.actualTheme);
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
        style={actualTheme === "light" ? oneLight : oneDark}
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
  content: string;
  className?: string;
  isFinished?: boolean;
}> = ({ content, isFinished }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < content.length && !isFinished) {
      const timer = setTimeout(() => {
        setIndex((pre) => pre + 5);
      }, 20);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [index, content.length]);
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
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-[var(--Ai-content-text)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3 text-[var(--Ai-content-text)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-[var(--Ai-content-text)]">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mt-3 mb-2 text-[var(--Ai-content-text)]">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium mt-2 mb-1 text-[var(--Ai-content-text)]">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-medium mt-2 mb-1 opacity-70 text-[var(--Ai-content-text)]">
              {children}
            </h6>
          ),
        }}
      >
        {isFinished ? content : content.slice(0, index)}
      </ReactMarkdown>
    </div>
  );
};

export default EAMarkdown;

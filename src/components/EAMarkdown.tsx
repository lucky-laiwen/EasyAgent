import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const EAMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch((err) => console.error("复制失败:", err));
  };

  return (
    <ReactMarkdown
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          return !inline && match ? (
            <div className="relative group my-2">
              {/* 包裹层，保证 sticky 生效 */}
              <div className="absolute w-full h-[calc(100%-10px)] top-[0px] flex justify-end pr-4 pt-[20px]">
                <button
                  onClick={() => copyToClipboard(codeString)}
                  className="sticky top-0 btn btn-xs btn-outline text-base-content"
                >
                  {copied ? "✅ 已复制" : "复制"}
                </button>
              </div>

              {/* 代码框 */}
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg"
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default EAMarkdown;

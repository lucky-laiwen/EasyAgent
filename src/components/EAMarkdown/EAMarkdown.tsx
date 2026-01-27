import { useEffect, useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useStore } from "@/store/store";
import remarkGfm from "remark-gfm";
// 单独组件，处理每个代码块
const CodeBlock = memo(
  ({ language, value }: { language: string; value: string }) => {
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
          <div className="flex items-center justify-between w-full h-[40px] rounded-tl-lg rounded-tr-lg bg-[var(--code-head)] px-4">
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
  },
);

// 目录树组件
const TreeBlock = memo(({ value }: { value: string }) => {
  // 把每一行拆出来，同时记录缩进层级
  const lines = value.split("\n").filter(Boolean);

  return (
    <div className="my-2 p-4 rounded-lg overflow-auto bg-[var(--markdown-head-bg)] text-sm font-mono">
      {lines.map((raw, idx) => {
        // 把前面的树形符号去掉，只留文件名
        const name = raw.replace(/^([│├└─]|\s{2,4})+/g, "").trim();
        return (
          <div key={idx} className="flex items-center h-6">
            <span className="text-[var(--Ai-content-text)]">{name}</span>
          </div>
        );
      })}
    </div>
  );
});

const EAMarkdown = memo(
  ({
    content,
    className,
    isFinished,
  }: {
    content: string;
    className?: string;
    isFinished?: boolean;
  }) => {
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
    }, [index, content.length, isFinished]);

    return (
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");

              /* 1. 目录树：显式声明 tree */
              if (!inline && match && match[1] === "tree") {
                return <TreeBlock value={codeString} />;
              }

              /* 2. 目录树：未声明语言，但内容像目录树 */
              if (
                !inline &&
                !match &&
                codeString.includes("├") && // 出现树形符号
                codeString.split("\n").length > 3 // 至少 4 行
              ) {
                return <TreeBlock value={codeString} />;
              }

              /* 3. 普通代码块 */
              if (!inline && match) {
                return <CodeBlock language={match[1]} value={codeString} />;
              }

              /* 4. 行内代码 */
              return (
                <code
                  className="inline-block px-1 text-sm font-medium text-[var(--Ai-content-text)] bg-[var(--Ai-think-bg)] rounded"
                  {...props}
                >
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
            ul: ({ children, ...props }) => (
              <ul className="list-disc pl-4 font-sans" {...props}>
                {children}
              </ul>
            ),
            li: ({ children, ...props }) => (
              <li className="text-[var(--Ai-content-text)]" {...props}>
                {/*
                  React-Markdown 会把纯文本 listItem 包一层 <p>，
                  我们直接把 children 里的 <p> 脱掉即可
                */}
                <div className="inline">{children}</div>
              </li>
            ),
          }}
        >
          {isFinished ? content : content.slice(0, index)}
        </ReactMarkdown>
      </div>
    );
  },
);

export default EAMarkdown;

import { memo, useEffect, useRef, useCallback, useState } from "react";
import { Check, Loader2, Copy } from "lucide-react";

import type { ChatItem, PptSlideOutline } from "@/store/store";

const SLIDE_WIDTH = 1280;
type TabKey = "ppt" | "html" | "outline";

function rewriteCdnToLocal(html: string): string {
  return html
    .replace(
      /https?:\/\/cdn\.tailwindcss\.com[^"'\s>]*/g,
      "/static/vendor/tailwind.js",
    )
    .replace(
      /https?:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net\/npm)\/lucide[^"'\s>]*/g,
      "/static/vendor/lucide.min.js",
    )
    .replace(
      /https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js[^"'\s>]*\.css[^"'\s>]*/g,
      "/static/vendor/reveal.css",
    )
    .replace(
      /https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js[^"'\s>]*/g,
      "/static/vendor/reveal.js",
    )
    .replace(
      /https?:\/\/fonts\.googleapis\.com[^"'\s>]*/g,
      "/static/vendor/fonts.css",
    );
}

const SlideIframe = memo(
  ({ html, slideIndex }: { html: string; slideIndex: number }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [scale, setScale] = useState(1);
    const [iframeHeight, setIframeHeight] = useState(720);

    const recalc = useCallback(() => {
      const container = containerRef.current;
      const iframe = iframeRef.current;
      if (!container) return;
      const s = container.offsetWidth / SLIDE_WIDTH;
      setScale(s);

      try {
        const doc = iframe?.contentDocument?.documentElement;
        if (doc && doc.scrollHeight > 0) {
          setIframeHeight(doc.scrollHeight);
        }
      } catch {
        // ignore
      }
    }, []);

    useEffect(() => {
      recalc();
      window.addEventListener("resize", recalc);
      const container = containerRef.current;
      const observer = container ? new ResizeObserver(() => recalc()) : null;
      observer?.observe(container!);
      return () => {
        window.removeEventListener("resize", recalc);
        observer?.disconnect();
      };
    }, [recalc]);

    useEffect(() => {
      try {
        const body = iframeRef.current?.contentDocument?.body;
        if (body) {
          body.scrollTop = body.scrollHeight;
        }
      } catch {
        // ignore
      }
      const timer = setTimeout(recalc, 50);
      return () => clearTimeout(timer);
    }, [html, recalc]);

    const handleLoad = () => {
      recalc();
    };

    return (
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-gray-100"
        style={{ height: Math.max(iframeHeight * scale, 200) }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={rewriteCdnToLocal(html)}
          sandbox="allow-scripts allow-same-origin"
          className="absolute top-0 left-0 border-none"
          style={{
            width: SLIDE_WIDTH,
            height: iframeHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          title={`Slide ${slideIndex + 1}`}
          onLoad={handleLoad}
        />
      </div>
    );
  },
);

const TAB_ORDER: TabKey[] = ["ppt", "html", "outline"];
const TAB_LABELS: Record<TabKey, string> = {
  ppt: "PPT",
  html: "HTML",
  outline: "大纲",
};

const SlideCard = memo(
  ({
    slide,
    html,
    status,
    total,
    globalDisabled,
  }: {
    slide: PptSlideOutline;
    html: string | undefined;
    status: "loading" | "done" | "error" | undefined;
    total: number;
    globalDisabled: boolean;
  }) => {
    const [activeTab, setActiveTab] = useState<TabKey>("outline");
    const [copied, setCopied] = useState(false);
    const preRef = useRef<HTMLDivElement>(null);
    const userTouched = useRef(false);

    const isDone = status === "done";
    const isLoading = status === "loading";
    const hasRealContent = !!html && html.trim().length > 0;

    // 完成时自动切到 PPT（仅用户未手动操作过）
    useEffect(() => {
      if (isDone && hasRealContent && !userTouched.current) {
        setActiveTab("ppt");
      }
    }, [isDone, hasRealContent]);

    // 有实际 HTML 内容时才切到 HTML，否则保持大纲
    const effectiveTab = !isDone && hasRealContent ? "html" : activeTab;

    const handleTabClick = (key: TabKey) => {
      userTouched.current = true;
      setActiveTab(key);
    };

    // 流式传输中（loading 或有内容但未完成）禁用切换
    const tabsDisabled = globalDisabled;

    const handleCopy = async () => {
      let text = "";
      if (effectiveTab === "outline") {
        text = `${slide.title}\n${slide.description}`;
      } else {
        text = html ?? "";
      }
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };

    // HTML 内容变化时滚动到底部
    useEffect(() => {
      if (effectiveTab === "html" && preRef.current) {
        preRef.current.scrollTop = preRef.current.scrollHeight;
      }
    }, [html, effectiveTab]);

    return (
      <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg">
        {/* 顶部栏 */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--code-head)]">
          <span className="text-xs text-[var(--Ai-think-text)] whitespace-nowrap">
            {slide.index + 1} / {total}
          </span>
          <span className="text-sm font-semibold text-[var(--Ai-content-text)] truncate flex-1">
            {slide.title}
          </span>

          {/* Tab 切换 */}
          <div className="flex items-center gap-0.5 bg-black/10 rounded-md p-0.5">
            {TAB_ORDER.map((key) => (
              <button
                key={key}
                disabled={tabsDisabled}
                onClick={() => handleTabClick(key)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  effectiveTab === key
                    ? "bg-[var(--Ai-content-bg)] text-[var(--Ai-content-text)] shadow-sm"
                    : "text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)]"
                } ${tabsDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>

          {/* 复制按钮：PPT tab 时禁用 */}
          <button
            onClick={handleCopy}
            disabled={effectiveTab === "ppt"}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors ${
              effectiveTab === "ppt"
                ? "opacity-30 cursor-not-allowed text-[var(--Ai-think-text)]"
                : "text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] hover:bg-black/10 cursor-pointer"
            }`}
          >
            <Copy size={13} />
            <span className="text-[11px]">{copied ? "已复制" : "复制"}</span>
          </button>

          {/* 状态指示 */}
          {isLoading ? (
            <Loader2 className="animate-spin text-primary" size={14} />
          ) : isDone ? (
            <Check className="text-green-400" size={14} strokeWidth={3} />
          ) : (
            <span className="text-xs text-[var(--Ai-think-text)]">等待中</span>
          )}
        </div>

        {/* 内容区域 */}
        {effectiveTab === "outline" && (
          <div className="p-4 bg-[var(--Ai-think-bg)] space-y-3">
            {slide.subtitle && (
              <p className="text-xs text-[var(--Ai-think-text)] font-medium tracking-wide uppercase">
                {slide.subtitle}
              </p>
            )}
            <p className="text-sm text-[var(--Ai-content-text)] leading-6">
              {slide.description}
            </p>
            {slide.points && slide.points.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {slide.points.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[var(--Ai-content-text)]"
                  >
                    <span className="mt-1 w-1 h-1 rounded-full bg-[var(--Ai-think-text)] flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {effectiveTab === "html" && hasRealContent && (
          <div
            ref={preRef}
            className="p-4 bg-[var(--Ai-think-bg)] max-h-[500px] overflow-auto"
          >
            <pre className="text-xs font-mono text-[var(--Ai-content-text)] whitespace-pre-wrap break-all">
              {html}
            </pre>
          </div>
        )}

        {effectiveTab === "ppt" && isDone && hasRealContent && (
          <SlideIframe html={html!} slideIndex={slide.index} />
        )}
      </div>
    );
  },
);

const PPT = memo(({ message }: { message: ChatItem }) => {
  const outline = message.ppt_outline;
  const slides = message.ppt_slides;
  const status = message.ppt_slide_status;

  if (!outline) return null;

  const allDone = outline.every(
    (s) => status?.[s.index] === "done" || status?.[s.index] === undefined,
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {outline.map((slide) => (
        <SlideCard
          key={slide.index}
          slide={slide}
          html={slides?.[slide.index]}
          status={status?.[slide.index]}
          total={outline.length}
          globalDisabled={!allDone}
        />
      ))}
    </div>
  );
});

export default PPT;

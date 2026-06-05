import { memo, useEffect, useRef, useCallback, useState, useMemo } from "react";
import {
  Check,
  Loader2,
  Copy,
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Palette,
  RotateCcw,
  ImagePlus,
  Upload,
  X,
  Eye,
} from "lucide-react";
import { message as antdMessage, Image as AntdImage } from "antd";
import { uploadChatFile } from "@/api/chat";
import EAModal from "@/components/EAModal";
import type { ChatItem, PptSlideOutline } from "@/store/store";

const SLIDE_WIDTH = 1280;
type TabKey = "ppt" | "html" | "outline";

// ========== SlideIframe（无变化） ==========

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
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin"
          className="absolute top-0 left-0 border-none"
          style={{
            width: SLIDE_WIDTH,
            height: iframeHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            overflow: "hidden",
          }}
          title={`Slide ${slideIndex + 1}`}
          onLoad={handleLoad}
        />
      </div>
    );
  },
);

// ========== SlideCard（无变化） ==========

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

    useEffect(() => {
      if (isDone && hasRealContent && !userTouched.current) {
        setActiveTab("ppt");
      }
    }, [isDone, hasRealContent]);

    const effectiveTab = !isDone && hasRealContent ? "html" : activeTab;

    const handleTabClick = (key: TabKey) => {
      userTouched.current = true;
      setActiveTab(key);
    };

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

    useEffect(() => {
      if (effectiveTab === "html" && preRef.current) {
        if (!isDone) {
          preRef.current.scrollTop = preRef.current.scrollHeight;
          preRef.current.style.overflow = "hidden";
        } else {
          preRef.current.style.overflow = "auto";
        }
      }
    }, [html, effectiveTab, isDone]);

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

          {isLoading ? (
            <Loader2 className="animate-spin text-primary" size={14} />
          ) : isDone ? (
            <Check className="text-green-400" size={14} strokeWidth={3} />
          ) : (
            <span className="text-xs text-[var(--Ai-think-text)]">等待中</span>
          )}
        </div>

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
            {/* 图片预览 */}
            {slide.images && slide.images.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                <AntdImage.PreviewGroup>
                  {slide.images.map((img, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-white/10 group relative"
                    >
                      <AntdImage
                        src={img.url}
                        alt={img.description || `图片 ${i + 1}`}
                        width={112}
                        height={80}
                        style={{ objectFit: "cover" }}
                        preview={{
                          mask: (
                            <div className="flex items-center gap-1 text-white text-xs">
                              <Eye size={12} />
                              预览
                            </div>
                          ),
                        }}
                        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='80' fill='%23333'%3E%3Crect width='112' height='80'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-size='12'%3E%3F%3C/text%3E%3C/svg%3E"
                      />
                    </div>
                  ))}
                </AntdImage.PreviewGroup>
              </div>
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

// ========== 大纲编辑器 ==========

const LAYOUT_OPTIONS = [
  { value: "title", label: "封面", desc: "居中大标题 + 副标题" },
  { value: "content", label: "内容", desc: "标题 + 要点列表" },
  { value: "grid", label: "网格", desc: "多列卡片并列" },
  { value: "split", label: "分栏", desc: "左文字 + 右图片" },
  { value: "summary", label: "总结", desc: "关键要点高亮" },
];

const PRESET_THEMES = [
  {
    name: "深蓝",
    theme: "dark",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    textColor: "#FFFFFF",
    subtextColor: "#94A3B8",
    backgroundCSS: "linear-gradient(135deg, #0F172A, #1E293B)",
  },
  {
    name: "暖橙",
    theme: "gradient",
    primaryColor: "#F59E0B",
    secondaryColor: "#D97706",
    textColor: "#FFFFFF",
    subtextColor: "#FDE68A",
    backgroundCSS: "linear-gradient(135deg, #78350F, #92400E)",
  },
  {
    name: "翠绿",
    theme: "light",
    primaryColor: "#10B981",
    secondaryColor: "#059669",
    textColor: "#FFFFFF",
    subtextColor: "#A7F3D0",
    backgroundCSS: "linear-gradient(135deg, #064E3B, #065F46)",
  },
  {
    name: "紫罗兰",
    theme: "gradient",
    primaryColor: "#8B5CF6",
    secondaryColor: "#6D28D9",
    textColor: "#FFFFFF",
    subtextColor: "#C4B5FD",
    backgroundCSS: "linear-gradient(135deg, #2E1065, #4C1D95)",
  },
  {
    name: "玫瑰",
    theme: "dark",
    primaryColor: "#F43F5E",
    secondaryColor: "#E11D48",
    textColor: "#FFFFFF",
    subtextColor: "#FECDD3",
    backgroundCSS: "linear-gradient(135deg, #4C0519, #881337)",
  },
];

interface OutlineEditorProps {
  message: ChatItem;
  onConfirm: (outline: { style: any; slides: any[] }) => void;
  onCancel: () => void;
  onRegenerate?: () => void;
  loading: boolean;
  regenerating?: boolean;
}

const OutlineEditor = memo(
  ({ message, onConfirm, onRegenerate, loading, regenerating }: OutlineEditorProps) => {
    const [slides, setSlides] = useState<PptSlideOutline[]>(
      message.ppt_outline ?? [],
    );
    const [style, setStyle] = useState(message.ppt_style ?? {});
    const [editingSlide, setEditingSlide] = useState<number | null>(null);
    const [showStylePanel, setShowStylePanel] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);
    const [imagePickerSlide, setImagePickerSlide] = useState<number | null>(
      null,
    );
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTargetRef = useRef<number | null>(null);

    // 从 web_search 工具调用中提取搜索结果图片
    const searchImages = useMemo(() => {
      const images: { url: string; title: string }[] = [];
      const seen = new Set<string>();
      for (const tc of message.tool_calls ?? []) {
        if (tc.tool_name !== "web_search" || !tc.tool_content) continue;
        try {
          const content =
            typeof tc.tool_content === "string"
              ? JSON.parse(tc.tool_content)
              : tc.tool_content;
          const imgs = content?.imgs ?? [];
          for (const img of imgs) {
            const url = img.image || img.thumbnail;
            if (url && !seen.has(url)) {
              seen.add(url);
              images.push({ url, title: img.title || "" });
            }
          }
        } catch {
          /* ignore parse errors */
        }
      }
      return images;
    }, [message.tool_calls]);

    // 编辑单页
    const updateSlide = useCallback(
      (index: number, updates: Partial<PptSlideOutline>) => {
        setSlides((prev) =>
          prev.map((s, i) => (i === index ? { ...s, ...updates } : s)),
        );
      },
      [],
    );

    // 编辑要点
    const updatePoint = useCallback(
      (slideIndex: number, pointIndex: number, value: string) => {
        setSlides((prev) =>
          prev.map((s, i) => {
            if (i !== slideIndex) return s;
            const points = [...(s.points ?? [])];
            points[pointIndex] = value;
            return { ...s, points };
          }),
        );
      },
      [],
    );

    const addPoint = useCallback((slideIndex: number) => {
      setSlides((prev) =>
        prev.map((s, i) => {
          if (i !== slideIndex) return s;
          return { ...s, points: [...(s.points ?? []), ""] };
        }),
      );
    }, []);

    const removePoint = useCallback(
      (slideIndex: number, pointIndex: number) => {
        setSlides((prev) =>
          prev.map((s, i) => {
            if (i !== slideIndex) return s;
            const points = (s.points ?? []).filter(
              (_, pi) => pi !== pointIndex,
            );
            return { ...s, points };
          }),
        );
      },
      [],
    );

    // 增删页面
    const addSlide = useCallback(() => {
      setSlides((prev) => [
        ...prev,
        {
          index: prev.length,
          title: "新页面",
          description: "",
          layout: "content",
          points: [],
        },
      ]);
    }, []);

    const removeSlide = useCallback((index: number) => {
      setSlides((prev) =>
        prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i })),
      );
    }, []);

    // 拖拽排序
    const handleDragStart = useCallback((index: number) => {
      setDragIndex(index);
    }, []);

    const handleDragOver = useCallback(
      (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index) {
          setDragOverIndex(index);
        }
      },
      [dragIndex],
    );

    const handleDrop = useCallback(
      (dropIndex: number) => {
        if (dragIndex === null || dragIndex === dropIndex) {
          setDragIndex(null);
          setDragOverIndex(null);
          return;
        }
        setSlides((prev) => {
          const newSlides = [...prev];
          const [moved] = newSlides.splice(dragIndex, 1);
          newSlides.splice(dropIndex, 0, moved);
          return newSlides.map((s, i) => ({ ...s, index: i }));
        });
        setDragIndex(null);
        setDragOverIndex(null);
      },
      [dragIndex],
    );

    const handleDragEnd = useCallback(() => {
      setDragIndex(null);
      setDragOverIndex(null);
    }, []);

    // 确认生成
    const handleConfirm = useCallback(() => {
      // 重新编排 index
      const finalSlides = slides.map((s, i) => ({ ...s, index: i }));
      onConfirm({ style, slides: finalSlides });
    }, [slides, style, onConfirm]);

    // 应用预设主题
    const applyPreset = useCallback(
      (preset: (typeof PRESET_THEMES)[number]) => {
        setStyle((prev) => ({
          ...prev,
          theme: preset.theme,
          primaryColor: preset.primaryColor,
          secondaryColor: preset.secondaryColor,
          textColor: preset.textColor,
          subtextColor: preset.subtextColor,
          backgroundCSS: preset.backgroundCSS,
        }));
      },
      [],
    );

    // 移动幻灯片
    const moveSlide = useCallback((from: number, to: number) => {
      setSlides((prev) => {
        if (to < 0 || to >= prev.length) return prev;
        const newSlides = [...prev];
        const [moved] = newSlides.splice(from, 1);
        newSlides.splice(to, 0, moved);
        return newSlides.map((s, i) => ({ ...s, index: i }));
      });
    }, []);

    // 上传图片
    const handleImageUpload = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const targetSlide = uploadTargetRef.current;
        if (!file || targetSlide === null) return;

        const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(
          file.name.split(".").pop()?.toLowerCase() ?? "",
        );
        if (!isImage) {
          antdMessage.warning("请上传图片文件（jpg/png/webp/gif）");
          return;
        }

        setUploadingSlide(targetSlide);
        try {
          const res = await uploadChatFile(file);
          const fileUrl = res.data?.data?.file_url;
          if (!fileUrl) {
            antdMessage.error("图片上传失败：未获取到URL");
            return;
          }
          setSlides((prev) =>
            prev.map((s, i) => {
              if (i !== targetSlide) return s;
              return {
                ...s,
                images: [
                  ...(s.images ?? []),
                  {
                    url: fileUrl,
                    type: "upload" as const,
                    description: file.name,
                    position: "main" as const,
                  },
                ],
              };
            }),
          );
          antdMessage.success("图片上传成功");
        } catch {
          antdMessage.error("图片上传失败");
        } finally {
          setUploadingSlide(null);
          uploadTargetRef.current = null;
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      [],
    );

    return (
      <div className="flex flex-col h-full relative">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--Ai-content-text)]">
              PPT 大纲
            </span>
            <span className="text-xs text-[var(--Ai-think-text)]">
              {slides.length} 页
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStylePanel(!showStylePanel)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer transition-colors"
            >
              <Palette size={12} />
              样式
              {showStylePanel ? (
                <ChevronUp size={10} />
              ) : (
                <ChevronDown size={10} />
              )}
            </button>
          </div>
        </div>

        {/* 样式面板 */}
        {showStylePanel && (
          <div className="px-4 py-3 border-b border-white/10 bg-[var(--Ai-think-bg)]">
            <div className="text-[11px] text-[var(--Ai-think-text)] mb-2">
              预设主题
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_THEMES.map((preset) => {
                const isSelected = style.primaryColor === preset.primaryColor;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all hover:scale-105 ${
                      isSelected ? "ring-2 ring-white/60 scale-105" : ""
                    }`}
                    style={{
                      background: preset.backgroundCSS,
                      color: preset.textColor,
                      border: `1px solid ${isSelected ? preset.primaryColor : preset.primaryColor + "40"}`,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    {preset.name}
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 幻灯片列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border transition-all ${
                editingSlide === idx
                  ? "border-primary/50 bg-[var(--Ai-content-bg)]"
                  : "border-white/10 bg-[var(--Ai-think-bg)]"
              } ${dragOverIndex === idx ? "border-primary border-2" : ""} ${
                dragIndex === idx ? "opacity-50" : ""
              }`}
            >
              {/* 卡片头部 */}
              <div className="flex items-center gap-2 px-3 py-2">
                <div
                  className="cursor-grab active:cursor-grabbing text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)]"
                  onMouseDown={() => handleDragStart(idx)}
                >
                  <GripVertical size={14} />
                </div>
                <span className="text-[11px] text-[var(--Ai-think-text)] w-5 text-center">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-[var(--Ai-content-text)] truncate">
                  {slide.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 text-[var(--Ai-think-text)]">
                  {slide.layout || "content"}
                </span>
                <button
                  onClick={() =>
                    setEditingSlide(editingSlide === idx ? null : idx)
                  }
                  className="p-1 rounded hover:bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => moveSlide(idx, idx - 1)}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer disabled:opacity-30"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => moveSlide(idx, idx + 1)}
                  disabled={idx === slides.length - 1}
                  className="p-1 rounded hover:bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer disabled:opacity-30"
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  onClick={() => removeSlide(idx)}
                  className="p-1 rounded hover:bg-red-500/20 text-[var(--Ai-think-text)] hover:text-red-400 cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* 编辑面板 */}
              {editingSlide === idx && (
                <div className="px-3 pb-3 space-y-2 border-t border-white/5">
                  {/* 标题 */}
                  <div>
                    <label className="text-[10px] text-[var(--Ai-think-text)] block mb-0.5">
                      标题
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) =>
                        updateSlide(idx, { title: e.target.value })
                      }
                      maxLength={15}
                      className="w-full px-2 py-1 text-sm rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 focus:border-primary/50 outline-none"
                    />
                  </div>
                  {/* 副标题 */}
                  <div>
                    <label className="text-[10px] text-[var(--Ai-think-text)] block mb-0.5">
                      副标题
                    </label>
                    <input
                      type="text"
                      value={slide.subtitle ?? ""}
                      onChange={(e) =>
                        updateSlide(idx, { subtitle: e.target.value })
                      }
                      className="w-full px-2 py-1 text-sm rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 focus:border-primary/50 outline-none"
                    />
                  </div>
                  {/* 描述 */}
                  <div>
                    <label className="text-[10px] text-[var(--Ai-think-text)] block mb-0.5">
                      描述
                    </label>
                    <textarea
                      value={slide.description}
                      onChange={(e) =>
                        updateSlide(idx, { description: e.target.value })
                      }
                      rows={2}
                      className="w-full px-2 py-1 text-sm rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 focus:border-primary/50 outline-none resize-none"
                    />
                  </div>
                  {/* 布局 */}
                  <div>
                    <label className="text-[10px] text-[var(--Ai-think-text)] block mb-0.5">
                      布局
                    </label>
                    <select
                      value={slide.layout || "content"}
                      onChange={(e) =>
                        updateSlide(idx, { layout: e.target.value })
                      }
                      className="w-full px-2 py-1 text-sm rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 outline-none cursor-pointer"
                    >
                      {LAYOUT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} - {opt.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* 要点 */}
                  <div>
                    <label className="text-[10px] text-[var(--Ai-think-text)] block mb-0.5">
                      要点
                    </label>
                    <div className="space-y-1">
                      {(slide.points ?? []).map((point, pi) => (
                        <div key={pi} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={point}
                            onChange={(e) =>
                              updatePoint(idx, pi, e.target.value)
                            }
                            className="flex-1 px-2 py-0.5 text-xs rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 focus:border-primary/50 outline-none"
                          />
                          <button
                            onClick={() => removePoint(idx, pi)}
                            className="p-0.5 rounded hover:bg-red-500/20 text-[var(--Ai-think-text)] hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addPoint(idx)}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer"
                      >
                        <Plus size={10} />
                        添加要点
                      </button>
                    </div>
                  </div>
                  {/* 视觉建议 */}
                  <div>
                    <label className="text-[10px] text-[var(--Ai-think-text)] block mb-0.5">
                      视觉建议
                    </label>
                    <input
                      type="text"
                      value={slide.visualSuggestion ?? ""}
                      onChange={(e) =>
                        updateSlide(idx, {
                          visualSuggestion: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1 text-sm rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 focus:border-primary/50 outline-none"
                    />
                  </div>
                  {/* 图片管理 */}
                  <div>
                    <label className="text-[10px] text-[var(--Ai-think-text)] block mb-0.5">
                      图片
                    </label>
                    <div className="space-y-1.5">
                      {(slide.images ?? []).map((img, pi) => (
                        <div key={pi} className="flex items-center gap-1.5">
                          <div className="w-12 h-9 rounded overflow-hidden border border-white/10 flex-shrink-0">
                            <AntdImage
                              src={img.url}
                              alt={img.description || `图片 ${pi + 1}`}
                              width={48}
                              height={36}
                              style={{ objectFit: "cover" }}
                              preview={{
                                mask: (
                                  <div className="flex items-center gap-0.5 text-white text-[10px]">
                                    <Eye size={10} />
                                    预览
                                  </div>
                                ),
                              }}
                              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='36' fill='%23666'%3E%3Crect width='48' height='36'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3E%3F%3C/text%3E%3C/svg%3E"
                            />
                          </div>
                          <input
                            type="text"
                            value={img.url}
                            onChange={(e) => {
                              const newImages = [...(slide.images ?? [])];
                              newImages[pi] = { ...img, url: e.target.value };
                              updateSlide(idx, { images: newImages });
                            }}
                            placeholder="图片 URL"
                            className="flex-1 px-2 py-0.5 text-xs rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 focus:border-primary/50 outline-none"
                          />
                          <select
                            value={img.position}
                            onChange={(e) => {
                              const newImages = [...(slide.images ?? [])];
                              newImages[pi] = {
                                ...img,
                                position: e.target.value as
                                  | "background"
                                  | "main",
                              };
                              updateSlide(idx, { images: newImages });
                            }}
                            className="px-1 py-0.5 text-[10px] rounded bg-black/10 text-[var(--Ai-content-text)] border border-white/10 outline-none cursor-pointer"
                          >
                            <option value="main">主图</option>
                            <option value="background">背景</option>
                          </select>
                          <button
                            onClick={() => {
                              const newImages = (slide.images ?? []).filter(
                                (_, i) => i !== pi,
                              );
                              updateSlide(idx, { images: newImages });
                            }}
                            className="p-0.5 rounded hover:bg-red-500/20 text-[var(--Ai-think-text)] hover:text-red-400 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setImagePickerSlide(idx)}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer"
                        >
                          <ImagePlus size={10} />
                          添加图片
                        </button>
                        <button
                          onClick={() => {
                            setEditingSlide(idx);
                            uploadTargetRef.current = idx;
                            fileInputRef.current?.click();
                          }}
                          disabled={uploadingSlide === idx}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer disabled:opacity-50"
                        >
                          {uploadingSlide === idx ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Upload size={10} />
                          )}
                          上传图片
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* 搜索图片选择弹窗 */}
          <EAModal
            open={imagePickerSlide !== null}
            onCancel={() => setImagePickerSlide(null)}
            title="选择图片"
            className="!w-[50%] !h-[60%]"
          >
            {searchImages.length === 0 ? (
              <p className="text-sm text-[var(--Ai-think-text)] text-center py-4">
                暂无搜索结果图片，请使用上传或链接方式添加
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 h-[100%]">
                {searchImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative group cursor-pointer rounded-lg overflow-[auto] border border-white/10 hover:border-primary/60 transition-colors"
                    onClick={() => {
                      if (imagePickerSlide === null) return;
                      const newImages = [
                        ...(slides[imagePickerSlide].images ?? []),
                        {
                          url: img.url,
                          type: "web" as const,
                          description: img.title,
                          position: "main" as const,
                        },
                      ];
                      updateSlide(imagePickerSlide, { images: newImages });
                      setImagePickerSlide(null);
                    }}
                  >
                    <AntdImage
                      src={img.url}
                      alt={img.title}
                      width="100%"
                      height={120}
                      style={{ objectFit: "cover" }}
                      preview={false}
                      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='80' fill='%23333'%3E%3Crect width='96' height='80'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666' font-size='10'%3E%3F%3C/text%3E%3C/svg%3E"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        选择
                      </span>
                    </div>
                    {img.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-[10px] text-white truncate">
                          {img.title}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  if (imagePickerSlide === null) return;
                  const newImages = [
                    ...(slides[imagePickerSlide].images ?? []),
                    {
                      url: "",
                      type: "web" as const,
                      description: "",
                      position: "main" as const,
                    },
                  ];
                  updateSlide(imagePickerSlide, { images: newImages });
                  setImagePickerSlide(null);
                }}
                className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer"
              >
                <ImagePlus size={12} />
                手动输入链接
              </button>
            </div>
          </EAModal>

          {/* 添加新页 */}
          <button
            onClick={addSlide}
            className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-white/20 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] hover:border-white/40 cursor-pointer transition-colors"
          >
            <Plus size={14} />
            <span className="text-xs">添加页面</span>
          </button>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-[var(--code-head)]">
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={loading || regenerating}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer disabled:opacity-50 transition-colors"
          >
            {regenerating ? (
              <Loader2 className="animate-spin" size={12} />
            ) : (
              <RotateCcw size={12} />
            )}
            {regenerating ? "重新生成中..." : "重新生成"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || slides.length === 0}
            className="flex items-center gap-1 px-4 py-1.5 text-xs rounded-lg bg-primary text-white hover:opacity-90 cursor-pointer disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={12} />
            ) : (
              <Check size={12} strokeWidth={3} />
            )}
            确认生成
          </button>
        </div>

        {/* 重新生成确认弹窗 */}
        <EAModal
          open={showRegenerateConfirm}
          onCancel={() => setShowRegenerateConfirm(false)}
          title="重新生成大纲"
          className="!w-[360px] !h-auto"
        >
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-[var(--Ai-content-text)]">
              确定要重新生成大纲吗？当前编辑的大纲内容将被替换。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="px-4 py-1.5 text-xs rounded-lg bg-black/10 text-[var(--Ai-think-text)] hover:text-[var(--Ai-content-text)] cursor-pointer transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowRegenerateConfirm(false);
                  onRegenerate?.();
                }}
                className="px-4 py-1.5 text-xs rounded-lg bg-primary text-white hover:opacity-90 cursor-pointer transition-opacity"
              >
                确认
              </button>
            </div>
          </div>
        </EAModal>

        {/* 重新生成 loading 遮罩 */}
        {regenerating && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--Ai-content-bg)]/80 backdrop-blur-sm">
            <Loader2 className="animate-spin text-primary mb-3" size={32} />
            <span className="text-sm text-[var(--Ai-content-text)]">正在重新生成大纲...</span>
          </div>
        )}
      </div>
    );
  },
);

// ========== 主组件 ==========

interface PPTProps {
  message: ChatItem;
  onConfirmOutline?: (outline: { style: any; slides: any[] }) => void;
  onCancelOutline?: () => void;
  onRegenerateOutline?: () => void;
  confirmLoading?: boolean;
  regenerating?: boolean;
}

const PPT = memo(
  ({
    message,
    onConfirmOutline,
    onCancelOutline,
    onRegenerateOutline,
    confirmLoading,
    regenerating,
  }: PPTProps) => {
    const outline = message.ppt_outline;
    const slides = message.ppt_slides;
    const status = message.ppt_slide_status;
    const outlineStatus = message.ppt_outline_status;

    if (!outline) {
      // 重新生成中 → 显示 loading
      if (regenerating) {
        return (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-sm text-[var(--Ai-think-text)]">正在重新生成大纲...</span>
          </div>
        );
      }
      return null;
    }

    // 大纲待确认状态 或 重新生成中 → 显示编辑器
    if ((outlineStatus === "pending" || regenerating) && onConfirmOutline && onCancelOutline) {
      return (
        <OutlineEditor
          message={message}
          onConfirm={onConfirmOutline}
          onCancel={onCancelOutline}
          onRegenerate={onRegenerateOutline}
          loading={confirmLoading ?? false}
          regenerating={regenerating}
        />
      );
    }

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
  },
);

export default PPT;

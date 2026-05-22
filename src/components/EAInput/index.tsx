import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Image, message } from "antd";
import styles from "./EAInput.module.scss";
import type { DocItem } from "@/api/knowledge";

export interface UploadedFile {
  file_id: number;
  filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
  text_content?: string | null;
}

interface EAInputSchema {
  inputValue: string;
  setInputValue: (value: string) => void;
  sendMessage: () => void;
  loading: boolean;
  className?: string;
  mode?: string;
  setMode?: (mode: string) => void;
  docList?: DocItem[];
  selectedDocIds?: number[];
  setSelectedDocIds?: (ids: number[]) => void;
  uploadingFiles?: { name: string; size: number }[];
  uploadedFiles?: UploadedFile[];
  onFilesAdd?: (files: File[]) => void;
  onFileRemove?: (fileId: number) => void;
  onStop?: () => void;
}

const EAInput = (props: EAInputSchema) => {
  const {
    inputValue,
    setInputValue,
    sendMessage,
    loading,
    className,
    mode,
    setMode,
    docList,
    selectedDocIds,
    setSelectedDocIds,
    uploadingFiles = [],
    uploadedFiles = [],
    onFilesAdd,
    onFileRemove,
    onStop,
  } = props;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);
  const compositionEndTimer = useRef<NodeJS.Timeout | null>(null);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadingFiles.length > 0;
  const canSend = !!inputValue.trim() && !isUploading && !loading;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        200,
      )}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (!docDropdownOpen) return;
    // 计算下拉框位置
    if (dropdownBtnRef.current) {
      const rect = dropdownBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top - 8,
        left: rect.left,
      });
    }
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        dropdownBtnRef.current &&
        !dropdownBtnRef.current.contains(e.target as Node)
      ) {
        setDocDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [docDropdownOpen]);

  const handleCompositionStart = () => {
    isComposing.current = true;
    if (compositionEndTimer.current) {
      clearTimeout(compositionEndTimer.current);
    }
  };

  const handleCompositionEnd = () => {
    compositionEndTimer.current = setTimeout(() => {
      isComposing.current = false;
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing.current) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        inputRef.current?.blur();
        sendMessage();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (compositionEndTimer.current) {
        clearTimeout(compositionEndTimer.current);
      }
    };
  }, []);

  const toggleDoc = (docId: number) => {
    if (!selectedDocIds || !setSelectedDocIds) return;
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  const completedDocs = docList?.filter((d) => d.status === "completed") ?? [];

  const ALLOWED_EXTENSIONS = [
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".py",
    ".js",
    ".pdf",
    ".doc",
    ".docx",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (!onFilesAdd) return;
      const files = Array.from(fileList);
      const accepted: File[] = [];
      const rejected: string[] = [];
      for (const file of files) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          accepted.push(file);
        } else {
          rejected.push(file.name);
        }
      }
      if (rejected.length > 0) {
        message.warning(`不支持的文件格式，已跳过：${rejected.join(", ")}`);
      }
      if (accepted.length > 0) {
        onFilesAdd(accepted);
      }
    },
    [onFilesAdd],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles],
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const isImageType = (fileType: string) =>
    ["jpg", "jpeg", "png", "webp"].includes(fileType.toLowerCase());

  return (
    <div className={`${styles["container_chat_bot"]} ${className}`}>
      <div className={styles["container-chat-options"]}>
        <div className={styles["chat"]}>
          <div className={`${styles["chat-bot"]} relative`}>
            {/* 文件附件区域（输入框内部上方） */}
            {(uploadingFiles.length > 0 ||
              uploadedFiles.length > 0 ||
              (selectedDocIds && selectedDocIds.length > 0)) && (
              <div className="flex flex-wrap gap-2.5 px-3 pt-3 pb-1.5">
                {/* 上传中的文件 */}
                {uploadingFiles.map((file, index) => (
                  <div
                    key={`uploading-${file.name}-${file.size}-${index}`}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl"
                    style={{
                      backgroundColor: "var(--chat-tag-bg)",
                      border: "1.5px solid var(--chat-tag-border)",
                    }}
                  >
                    <span className="loading loading-spinner loading-sm text-amber-500"></span>
                    <span
                      className="text-[12px] max-w-[200px] truncate"
                      style={{ color: "var(--chat-placeholder)" }}
                    >
                      {file.name}
                    </span>
                  </div>
                ))}
                {/* 已上传的文件 */}
                {uploadedFiles.map((file) => {
                  const isImg = isImageType(file.file_type);
                  if (isImg) {
                    return (
                      <div
                        key={file.file_id}
                        className="group relative rounded-xl overflow-hidden"
                        style={{
                          border: "1.5px solid var(--chat-tag-border)",
                          maxWidth: 120,
                          maxHeight: 120,
                        }}
                      >
                        <Image
                          src={file.file_url}
                          alt={file.filename}
                          style={{
                            display: "block",
                            maxWidth: 120,
                            maxHeight: 120,
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                          }}
                          preview={{ mask: null }}
                        />
                        {onFileRemove && (
                          <button
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            style={{
                              backgroundColor: "var(--chat-border)",
                              color: "var(--chat-text)",
                            }}
                            onClick={() => onFileRemove(file.file_id)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={file.file_id}
                      className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl"
                      style={{
                        backgroundColor: "var(--chat-tag-bg)",
                        border: "1.5px solid var(--chat-tag-border)",
                      }}
                    >
                      <div
                        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg"
                        style={{ backgroundColor: "var(--Ai-think-bg)" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="text-[12px] truncate max-w-[180px]"
                          style={{ color: "var(--chat-text)" }}
                        >
                          {file.filename}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--chat-placeholder)" }}
                        >
                          {file.file_type.toUpperCase()}{" "}
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                      {onFileRemove && (
                        <button
                          className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          style={{
                            backgroundColor: "var(--chat-border)",
                            color: "var(--chat-text)",
                          }}
                          onClick={() => onFileRemove(file.file_id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                {/* 知识库文档标签 */}
                {selectedDocIds?.map((id) => {
                  const doc = docList?.find((d) => d.id === id);
                  if (!doc) return null;
                  return (
                    <div
                      key={id}
                      className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl"
                      style={{
                        backgroundColor: "var(--chat-tag-bg)",
                        border: "1.5px solid var(--chat-tag-border)",
                      }}
                    >
                      <div
                        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg"
                        style={{ backgroundColor: "var(--Ai-think-bg)" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                      </div>
                      <span
                        className="text-[12px] truncate max-w-[180px]"
                        style={{ color: "var(--chat-text)" }}
                      >
                        {doc.filename}
                      </span>
                      <button
                        className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        style={{
                          backgroundColor: "var(--chat-border)",
                          color: "var(--chat-text)",
                        }}
                        onClick={() => toggleDoc(id)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".txt,.md,.csv,.json,.py,.js,.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileInputChange}
            />

            <textarea
              ref={inputRef}
              id="chat_bot"
              name="chat_bot"
              placeholder="Imagine Something...✦˚"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              style={{ resize: "none" }}
            />
          </div>

          <div className={styles["options"]}>
            <div className={styles["btns-add"]}>
              {/* 附件按钮 */}
              {onFilesAdd && (
                <button
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="添加文件附件"
                  disabled={isUploading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
              )}

              {/* 知识库文档选择按钮 */}
              {completedDocs.length > 0 && setSelectedDocIds && (
                <div className="relative">
                  <button
                    ref={dropdownBtnRef}
                    className={`cursor-pointer ${selectedDocIds && selectedDocIds.length > 0 ? "text-primary" : ""}`}
                    onClick={() => setDocDropdownOpen(!docDropdownOpen)}
                    title="挂载知识库文档"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                  </button>
                  {docDropdownOpen &&
                    createPortal(
                      <div
                        ref={dropdownRef}
                        className="fixed w-[260px] rounded-lg shadow-lg p-2 max-h-[240px] overflow-y-auto z-[9999]"
                        style={{
                          top: dropdownPos.top,
                          left: dropdownPos.left,
                          transform: "translateY(-100%)",
                          backgroundColor: "var(--login-bg)",
                          border: "1px solid var(--chat-border)",
                        }}
                      >
                        <div
                          className="text-[11px] px-2 py-1"
                          style={{ color: "var(--chat-placeholder)" }}
                        >
                          选择知识库文档
                        </div>
                        {completedDocs.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer"
                            style={{
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "var(--Ai-think-bg)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <input
                              type="checkbox"
                              className="checkbox checkbox-xs"
                              checked={selectedDocIds?.includes(doc.id) ?? false}
                              onChange={() => toggleDoc(doc.id)}
                            />
                            <span
                              className="text-sm truncate flex-1"
                              style={{ color: "var(--chat-text)" }}
                            >
                              {doc.filename}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: "var(--chat-placeholder)" }}
                            >
                              {doc.chunk_count}c
                            </span>
                          </label>
                        ))}
                      </div>,
                      document.body,
                    )}
                </div>
              )}

              {setMode && (
                <div
                  className="relative flex items-center rounded-md p-[2px] ml-1 overflow-hidden border border-[var(--chat-border)]"
                  style={{ backgroundColor: "var(--toggle-bg)" }}
                >
                  <div
                    className="absolute left-[2px] top-[2px] bottom-[2px] w-[calc(50%-2px)] rounded-[4px] transition-transform duration-200 ease-in-out"
                    style={{
                      backgroundColor: "var(--toggle-slider)",
                      transform:
                        (mode ?? "text") === "ppt"
                          ? "translateX(100%)"
                          : "translateX(0)",
                    }}
                  />
                  {(["text", "ppt"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="relative z-10 px-3 py-[2px] text-[11px] font-medium rounded-[6px] transition-colors duration-200 cursor-pointer"
                      style={{
                        color:
                          (mode ?? "text") === m
                            ? "var(--toggle-text-active)"
                            : "var(--toggle-text-inactive)",
                        transform: "translateY(0)",
                      }}
                    >
                      {m === "text" ? "Text" : "PPT"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`${styles["btn-submit"]} ${
                loading || !canSend ? styles["focus-svg"] : ""
              }`}
              onClick={loading ? onStop : sendMessage}
              disabled={loading ? false : !canSend}
            >
              <i>
                {loading ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 512 512">
                    <path
                      fill="currentColor"
                      d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05"
                    ></path>
                  </svg>
                )}
              </i>
            </button>
          </div>
        </div>
      </div>

      <div className={styles["tags"]}>
        <span>Create An Image</span>
        <span>Analyse Data</span>
        <span>More</span>
      </div>
    </div>
  );
};

export default EAInput;

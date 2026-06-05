import React, { useState, useEffect, useRef } from "react";
import EAButton from "@/components/EAButton";
import EAMessage from "@/components/EAMessage";
import KnowledgeModal from "./KnowledgeModal";
import {
  getGlobalDocList,
  uploadDoc,
  type DocItem,
} from "@/api/knowledge";
import { IconBookOpen } from "@/assets/icons";

interface EAKnowledgeProps {
  onDocListChange?: () => void;
}

const EAKnowledge: React.FC<EAKnowledgeProps> = ({ onDocListChange }) => {
  const [docList, setDocList] = useState<DocItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDocId, setModalDocId] = useState<number | null>(null);
  const [modalDocName, setModalDocName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocList = async () => {
    try {
      const res = await getGlobalDocList();
      if (res.data.success) {
        setDocList(res.data.data);
        onDocListChange?.();
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchDocList();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDoc(file);
      if (res.data.success) {
        EAMessage.success("上传成功，正在处理中");
        fetchDocList();
      }
    } catch {
      EAMessage.error("上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleViewDoc = (docId: number, docName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalDocId(docId);
    setModalDocName(docName);
    setModalOpen(true);
  };

  const statusIcon = (status: DocItem["status"]) => {
    if (status === "completed")
      return <span className="text-green-400 text-xs">✓</span>;
    if (status === "processing")
      return <span className="loading loading-spinner loading-xs"></span>;
    return <span className="text-red-400 text-xs">✕</span>;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.doc,.docx,.md"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="w-full">
        <div
          className="dropdown dropdown-right dropdown-center w-full"
          data-dropdown-offset="8"
        >
          <EAButton
            text="知识库"
            className="flex w-full justify-start bg-[transparent] rounded-lg border-none shadow-none hover:bg-[var(--Ai-think-bg)]"
            icon={<IconBookOpen className="w-[18px] h-[18px]" />}
          />
          <ul
            tabIndex={-1}
            className="dropdown-content ml-4 menu bg-base-100 rounded-box w-[260px] p-2 shadow-sm max-h-[400px] overflow-y-auto [&_li]:hover:bg-transparent [&_li]:focus:bg-transparent [&_a]:hover:bg-transparent [&_a]:focus:bg-transparent"
            onMouseDown={(e) => e.preventDefault()}
          >
            {/* 上传按钮 */}
            <li>
              <button
                className="flex items-center gap-2 text-sm rounded-lg"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <span className="text-lg">📤</span>
                )}
                <span>上传全局文档</span>
              </button>
            </li>

            <div className="divider my-1"></div>

            {/* 文档列表 */}
            {docList.length === 0 ? (
              <li className="text-center text-sm text-gray-400 py-2">
                暂无文档
              </li>
            ) : (
              docList.map((doc) => (
                <li key={doc.id}>
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg"
                    onClick={(e) => handleViewDoc(doc.id, doc.filename, e)}
                  >
                    {statusIcon(doc.status)}
                    <span className="text-sm flex-1 truncate">
                      {doc.filename}
                    </span>
                    <span className="text-xs text-gray-400">
                      {doc.chunk_count}c
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <KnowledgeModal
        open={modalOpen}
        docId={modalDocId}
        docName={modalDocName}
        onClose={() => setModalOpen(false)}
        onDeleted={() => {
          fetchDocList();
        }}
      />
    </>
  );
};

export default EAKnowledge;

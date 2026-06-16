import { useEffect, useState } from "react";
import EAModal from "@/components/EAModal";
import EAMessage from "@/components/EAMessage";
import {
  getDocContent,
  deleteDoc,
  type DocContent,
} from "@/api/knowledge";

interface Props {
  open: boolean;
  docId: number | null;
  docName: string;
  snippet?: string;
  chunkIndex?: number;
  onClose: () => void;
  onDeleted: () => void;
}

type ViewMode = "snippet" | "full";

const KnowledgeModal: React.FC<Props> = ({
  open,
  docId,
  docName,
  snippet,
  chunkIndex,
  onClose,
  onDeleted,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("snippet");
  const [docContent, setDocContent] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(false);

  // 打开时重置：有 snippet 则显示片段，否则自动加载完整文档
  useEffect(() => {
    if (open) {
      setDocContent(null);
      if (snippet) {
        setViewMode("snippet");
      } else {
        setViewMode("full");
        // 自动加载完整文档内容
        if (docId) {
          setLoading(true);
          getDocContent(docId)
            .then((res) => {
              if (res.success) setDocContent(res.data);
            })
            .catch(() => {
              EAMessage.error("获取完整文档失败");
            })
            .finally(() => setLoading(false));
        }
      }
    }
  }, [open, docId, snippet]);

  const handleLoadFull = async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const res = await getDocContent(docId);
      if (res.success) {
        setDocContent(res.data);
        setViewMode("full");
      }
    } catch {
      EAMessage.error("获取完整文档失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!docId) return;
    try {
      const res = await deleteDoc(docId);
      if (res.success) {
        EAMessage.success("删除成功");
        onDeleted();
        onClose();
      }
    } catch {
      EAMessage.error("删除失败");
    }
  };

  return (
    <EAModal open={open} title={docName} onCancel={onClose} fotter={null}>
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">
          {viewMode === "snippet" && chunkIndex !== undefined
            ? `Chunk #${chunkIndex}`
            : viewMode === "full"
              ? `全部 ${docContent?.chunk_count ?? ""} 个分块`
              : ""}
        </span>
        {viewMode === "snippet" && (
          <button
            onClick={handleLoadFull}
            disabled={loading}
            className="px-3 py-1 text-xs rounded-lg bg-primary text-white hover:opacity-90 cursor-pointer disabled:opacity-50 transition-opacity"
          >
            {loading ? "加载中..." : "查看完整文档"}
          </button>
        )}
      </div>

      {viewMode === "snippet" ? (
        snippet ? (
          <div className="p-3 rounded-lg bg-base-200 text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
            {snippet}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">暂无块内容</div>
        )
      ) : docContent ? (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {docContent.chunks.map((chunk) => (
            <div
              key={chunk.chunk_index}
              className="p-3 rounded-lg bg-base-200 text-sm"
            >
              <div className="text-xs text-gray-400 mb-1">
                Chunk #{chunk.chunk_index}
              </div>
              <div className="whitespace-pre-wrap">{chunk.content}</div>
            </div>
          ))}
          <div className="divider my-1"></div>
          <button
            className="btn btn-error btn-sm btn-outline"
            onClick={handleDelete}
          >
            删除此文档
          </button>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400">暂无内容</div>
      )}
    </EAModal>
  );
};

export default KnowledgeModal;

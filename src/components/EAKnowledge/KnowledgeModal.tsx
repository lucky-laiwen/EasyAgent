import React, { useEffect, useState } from "react";
import EAModal from "@/components/EAModal";
import EAMessage from "@/components/EAMessage";
import { getDocContent, deleteDoc, type DocContent } from "@/api/knowledge";

interface Props {
  open: boolean;
  docId: number | null;
  docName: string;
  onClose: () => void;
  onDeleted: () => void;
}

const KnowledgeModal: React.FC<Props> = ({
  open,
  docId,
  docName,
  onClose,
  onDeleted,
}) => {
  const [docContent, setDocContent] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && docId) {
      setLoading(true);
      getDocContent(docId)
        .then((res) => {
          if (res.data.success) {
            setDocContent(res.data.data);
          }
        })
        .catch(() => {
          EAMessage.error("获取文档内容失败");
        })
        .finally(() => setLoading(false));
    } else {
      setDocContent(null);
    }
  }, [open, docId]);

  const handleDelete = async () => {
    if (!docId) return;
    try {
      const res = await deleteDoc(docId);
      if (res.data.success) {
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
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : docContent ? (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>类型: {docContent.file_type}</span>
            <span>分块数: {docContent.chunk_count}</span>
          </div>
          <div className="divider my-1"></div>
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

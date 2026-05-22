// hooks/useStreamAIMessage.ts
import { sendMessage } from "@/utils/chat";
import { updateMessage, addMessage } from "@/store/store";
import { useRef, useEffect, useCallback } from "react";

export function useStreamAIMessage() {
  /* ---------- 1. 缓冲池 ---------- */
  const bufferRef = useRef<{
    content: string;
    think_content: string;
  }>({ content: "", think_content: "" });

  const aiMsgIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /* ---------- 2. 真正把缓冲写入全局 store ---------- */

  const flush = useCallback(() => {
    if (!aiMsgIdRef.current) return;

    // 1. 生成全新对象
    const snapshot = {
      content: bufferRef.current.content,
      think_content: bufferRef.current.think_content,
      id: aiMsgIdRef.current,
    };

    // 2. 写 store → 地址变了，组件就能收到新值
    updateMessage(snapshot);

    // 3. 缓冲池也换成新对象，后续再改就不会污染旧快照
    bufferRef.current = {
      content: "", // 只清正文
      think_content: "", // 只清思考内容
    };
  }, []);

  /* ---------- 3. 16 ms 节流 ---------- */
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const streamAIMessage = useCallback(
    async (chatId: number, message: string, mode?: string, docIds?: number[], fileIds?: number[]) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const aiMessageId = Date.now() + 1;
      aiMsgIdRef.current = aiMessageId;

      addMessage({ id: aiMessageId, sender: 1, content: "", finished: false });

      try {
        for await (const chunk of sendMessage(
          {
            id: chatId,
            message,
            ...(mode && { mode }),
            ...(docIds && docIds.length > 0 && { doc_ids: docIds }),
            ...(fileIds && fileIds.length > 0 && { file_ids: fileIds }),
          },
          controller.signal,
        ) as AsyncIterable<any>) {
          // references 没有 type 字段，直接检查 references 字段
          if (chunk.references) {
            flush();
            updateMessage({
              id: aiMessageId,
              rag_references: chunk.references,
            });
            continue;
          }

          switch (chunk.type) {
            case "think":
              bufferRef.current.think_content += chunk.content ?? "";
              break;
            case "text":
              bufferRef.current.content += chunk.content ?? "";
              break;
            case "tool_name":
              updateMessage({
                id: aiMessageId,
                tool_obj: chunk.tool_name,
              });
              break;
            case "tool_content":
              const tool_content = chunk.tool_content;
              updateMessage({
                id: aiMessageId,
                tool_obj: {
                  ...tool_content,
                  tool_content: JSON.parse(tool_content.tool_content),
                },
              });
              break;
            case "outline":
              flush();
              updateMessage({
                id: aiMessageId,
                ppt_outline: chunk.slides,
                ppt_style: chunk.style,
                message_type: "ppt",
              });
              break;
            case "slide_start":
              flush();
              updateMessage({
                id: aiMessageId,
                ppt_slide_index: chunk.index,
                ppt_slide_html: "",
                ppt_slide_status: "loading",
              });
              break;
            case "slide_chunk":
              updateMessage({
                id: aiMessageId,
                ppt_slide_index: chunk.index,
                ppt_slide_html: chunk.content,
              });
              break;
            case "slide_end":
              flush();
              updateMessage({
                id: aiMessageId,
                ppt_slide_index: chunk.index,
                ppt_slide_status: "done",
              });
              break;
            default:
              console.warn("unknown chunk type", chunk);
              break;
          }

          if (timerRef.current) window.clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(flush, 16);
        }
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          throw e;
        }
      } finally {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        flush();
        updateMessage({ id: aiMessageId, finished: true });
        abortControllerRef.current = null;
      }
    },
    [flush],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { streamAIMessage, stopStreaming };
}

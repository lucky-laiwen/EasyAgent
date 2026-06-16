// hooks/useStreamAIMessage.ts
import {
  sendMessage,
  sendPptOutline,
  updateOutline,
  sendPptGenerate,
} from "@/utils/chat";
import { updateMessage, addMessage, resetMessage } from "@/store/store";
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
            case "tool_content": {
              const tool_content = chunk.tool_content;
              updateMessage({
                id: aiMessageId,
                tool_obj: {
                  ...tool_content,
                  tool_content: JSON.parse(tool_content.tool_content),
                },
              });
              break;
            }
            case "outline":
              flush();
              updateMessage({
                id: aiMessageId,
                ppt_outline: chunk.slides,
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

// ========== PPT 大纲生成 + PPT 生成 ==========

export function useStreamPpt() {
  const bufferRef = useRef<{ content: string; think_content: string }>({
    content: "",
    think_content: "",
  });
  const aiMsgIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const flush = useCallback(() => {
    if (!aiMsgIdRef.current) return;
    updateMessage({
      content: bufferRef.current.content,
      think_content: bufferRef.current.think_content,
      id: aiMsgIdRef.current,
    });
    bufferRef.current = { content: "", think_content: "" };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  /** 第一步：生成大纲（传入 existingMessageId 则为重新生成，更新已有消息） */
  const streamOutline = useCallback(
    async (
      chatId: number,
      message: string,
      docIds?: number[],
      fileIds?: number[],
      existingMessageId?: number,
      existingOutlineMessageId?: number,
    ) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const aiMessageId = existingMessageId ?? Date.now() + 1;
      aiMsgIdRef.current = aiMessageId;

      if (!existingMessageId) {
        addMessage({
          id: aiMessageId,
          sender: 1,
          content: "",
          finished: false,
          message_type: "ppt",
        });
      } else {
        // 重新生成：重置已有消息的大纲状态
        resetMessage(aiMessageId, {
          content: "",
          think_content: "",
          finished: false,
          ppt_outline: undefined,
          ppt_style: undefined,
          ppt_outline_status: undefined,
          ppt_outline_message_id: undefined,
          ppt_slides: undefined,
          ppt_slide_status: undefined,
          tool_calls: undefined,
        });
      }

      let outlineMessageId: number | undefined;

      try {
        for await (const chunk of sendPptOutline(
          existingOutlineMessageId
            ? { message_id: existingOutlineMessageId }
            : {
                id: chatId,
                message,
                ...(docIds && docIds.length > 0 && { doc_ids: docIds }),
                ...(fileIds && fileIds.length > 0 && { file_ids: fileIds }),
              },
          controller.signal,
        ) as AsyncIterable<any>) {
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
            case "tool_start":
            case "tool_name":
              updateMessage({
                id: aiMessageId,
                tool_obj: chunk.tool_name ?? {
                  id: Date.now(),
                  tool_name: chunk.tool,
                  tool_content: null,
                  tool_input: chunk.args || "",
                  status: 2,
                  created_at: new Date().toISOString(),
                },
              });
              break;
            case "tool_mid":
            case "tool_content": {
              const toolData = chunk.tool_content ?? chunk;
              updateMessage({
                id: aiMessageId,
                tool_obj: {
                  ...toolData,
                  tool_content:
                    typeof toolData.tool_content === "string"
                      ? JSON.parse(toolData.tool_content)
                      : toolData.tool_content,
                },
              });
              break;
            }
            case "outline":
              flush();
              updateMessage({
                id: aiMessageId,
                ppt_outline: chunk.slides,
                ppt_outline_status: "pending",
                message_type: "ppt",
                content: "",
              });
              break;
            default:
              // done 事件可能携带 message_id
              if (chunk.done && chunk.message_id) {
                outlineMessageId = chunk.message_id;
              }
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
        updateMessage({
          id: aiMessageId,
          finished: true,
          ...(outlineMessageId && {
            ppt_outline_message_id: outlineMessageId,
          }),
        });
        abortControllerRef.current = null;
      }

      return { aiMessageId, outlineMessageId };
    },
    [flush],
  );

  /** 第二步：确认大纲并生成 PPT */
  const confirmAndGenerate = useCallback(
    async (
      chatId: number,
      aiMessageId: number,
      outlineMessageId: number,
      outline: { style: any; slides: any[] },
    ) => {
      // 1. 提交修改后的大纲（只需 slides）
      const updateRes = await updateOutline({
        message_id: outlineMessageId,
        outline: { slides: outline.slides },
      });
      if (!updateRes.success) {
        throw new Error(updateRes.message || "大纲更新失败");
      }

      // 2. 更新状态为 generating，重置 finished 以隐藏操作栏
      updateMessage({
        id: aiMessageId,
        finished: false,
        ppt_outline_status: "generating",
        ppt_outline: outline.slides,
        ppt_style: outline.style,
      });

      // 3. 开始生成 PPT（带上 style）
      aiMsgIdRef.current = aiMessageId;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        for await (const chunk of sendPptGenerate(
          { id: chatId, message_id: outlineMessageId, style: outline.style },
          controller.signal,
        ) as AsyncIterable<any>) {
          switch (chunk.type) {
            case "think":
              bufferRef.current.think_content += chunk.content ?? "";
              break;
            case "text":
              bufferRef.current.content += chunk.content ?? "";
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
        updateMessage({
          id: aiMessageId,
          finished: true,
          ppt_outline_status: "confirmed",
        });
        abortControllerRef.current = null;
      }
    },
    [flush],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { streamOutline, confirmAndGenerate, stopStreaming };
}

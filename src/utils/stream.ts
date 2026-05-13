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
    async (chatId: number, message: string) => {
      const aiMessageId = Date.now() + 1;
      aiMsgIdRef.current = aiMessageId;

      addMessage({ id: aiMessageId, sender: 1, content: "", finished: false });

      for await (const chunk of sendMessage({
        id: chatId,
        message,
      }) as AsyncIterable<any>) {
        /* 4. 把 chunk 先扔进缓冲池，而不是立刻 updateMessage */

        switch (chunk.type) {
          case "think":
            bufferRef.current.think_content += chunk.content ?? "";
            break;
          case "text":
            bufferRef.current.content += chunk.content ?? "";
            break;
          case "tool_name":
            // 创建新的工具调用记录（chunk.tool_name 已经是完整的 ToolCall 对象）
            updateMessage({
              id: aiMessageId,
              tool_obj: chunk.tool_name,
            });
            break;
          case "tool_content":
            // 工具内容更新（chunk.tool_content 也是完整的 ToolCall，tool_content 字段需先解析）
            const tool_content = chunk.tool_content;
            updateMessage({
              id: aiMessageId,
              tool_obj: {
                ...tool_content,
                tool_content: JSON.parse(tool_content.tool_content),
              },
            });
            break;
          default:
            console.warn("unknown chunk type", chunk);
            break;
        }

        /* 5. 16 ms 内如果还有新 chunk 进来，就继续等 */
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(flush, 16);
      }

      /* 6. 流结束，把剩余内容一次性刷出去 */
      if (timerRef.current) window.clearTimeout(timerRef.current);
      flush();
      updateMessage({ id: aiMessageId, finished: true });
    },
    [flush],
  );

  return { streamAIMessage };
}

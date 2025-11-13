// hooks/useStreamAIMessage.ts

import { sendMessage } from "@/utils/chat";
import { updateMessage, addMessage } from "@/store/store";
export function useStreamAIMessage() {
  const streamAIMessage = async (chatId: number, message: string) => {
    const aiMessageId = Date.now() + 1;

    addMessage({ id: aiMessageId, sender: 1, content: "", finished: false });

    for await (const chunk of sendMessage({
      id: chatId,
      message,
    }) as AsyncIterable<any>) {
      updateMessage({
        id: aiMessageId,
        content: chunk.content,
        tool_content: chunk.tool_content,
        tool_name: chunk.tool_name,
        type: chunk.type,
        finished: false,
      });
    }
    updateMessage({ id: aiMessageId, finished: true });
  };

  return { streamAIMessage };
}

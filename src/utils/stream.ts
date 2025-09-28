// hooks/useStreamAIMessage.ts
import { useDispatch } from "react-redux";
import { addMessage, updateMessage } from "@/store/modules/messageStore";
import { sendMessage } from "@/utils/chat";

export function useStreamAIMessage() {
  const dispatch = useDispatch();

  const streamAIMessage = async (chatId: number, message: string) => {
    const aiMessageId = Date.now() + 1;
    dispatch(
      addMessage({ id: aiMessageId, sender: 1, content: "", finished: false })
    );

    for await (const chunk of sendMessage({
      id: chatId,
      message,
    }) as AsyncIterable<any>) {
      dispatch(
        updateMessage({
          id: aiMessageId,
          content: chunk.content,
          type: chunk.type,
          finished: false,
        })
      );
    }
    dispatch(updateMessage({ id: aiMessageId, finished: true }));
  };

  return { streamAIMessage };
}

import { useEffect, useRef, useState } from "react";
import { createChatSocket } from "@/api/userChat";
import { useStore } from "@/store/store";
export default function Chat() {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const userInfo = useStore((store) => store.user);
  const targetUserId = userInfo?.id === 4 ? 3 : 4; // 私聊对象

  useEffect(() => {
    socketRef.current = createChatSocket(userInfo?.id);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
    };

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const sendMessage = () => {
    socketRef.current?.send(
      JSON.stringify({
        to_user_id: targetUserId,
        content,
      })
    );
    setContent("");
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.from_user_id}:</b> {msg.content}
          </div>
        ))}
      </div>

      <input
        type="text"
        className="input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={sendMessage}>发送</button>
    </div>
  );
}

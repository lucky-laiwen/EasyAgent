type SendMessageSchemas = {
  id: number;
  message: string;
};

export async function* sendMessage(
  params: SendMessageSchemas,
): AsyncGenerator<string, void, unknown> {
  const res = await fetch("http://g8ae9cac.natappfree.cc/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.replace(/^data:\s*/, "");
        const dataObj = JSON.parse(jsonStr);
        if (dataObj) {
          yield dataObj; // 用 yield 替代 onChunk 回调
        }
      } else {
        return undefined; // 提前结束 generator
      }
    }
  }
}

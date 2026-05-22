type SendMessageSchemas = {
  id: number;
  message: string;
  mode?: string;
  doc_ids?: number[];
  file_ids?: number[];
};

export async function* sendMessage(
  params: SendMessageSchemas,
  signal?: AbortSignal,
): AsyncGenerator<Record<string, any>, void, unknown> {
  const res = await fetch("http://localhost:8000/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
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
      if (line.startsWith("event: error")) {
        const errorLine = line.split("\n").find((l) => l.startsWith("data:"));
        const errData = errorLine
          ? JSON.parse(errorLine.replace(/^data:\s*/, ""))
          : {};
        throw new Error(errData.error || "Stream error");
      }

      if (line.startsWith("event: done") || line.trim() === "") {
        return;
      }

      if (line.startsWith("data:")) {
        const jsonStr = line.replace(/^data:\s*/, "");
        yield JSON.parse(jsonStr);
      }
    }
  }
}

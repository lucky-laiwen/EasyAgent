type SendMessageSchemas = {
  id: number;
  message: string;
  mode?: string;
  doc_ids?: number[];
  file_ids?: number[];
};

const AUTH_HEADERS = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

async function* readSSEStream(
  res: Response,
): AsyncGenerator<Record<string, any>, void, unknown> {
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

      if (line.startsWith("event: done")) {
        // The done event may carry data (e.g. message_id) on the next line
        const dataLine = line.split("\n").find((l) => l.startsWith("data:"));
        if (dataLine) {
          const jsonStr = dataLine.replace(/^data:\s*/, "");
          yield JSON.parse(jsonStr);
        }
        return;
      }

      if (line.trim() === "") {
        continue;
      }

      if (line.startsWith("data:")) {
        const jsonStr = line.replace(/^data:\s*/, "");
        yield JSON.parse(jsonStr);
      }
    }
  }
}

export async function* sendMessage(
  params: SendMessageSchemas,
  signal?: AbortSignal,
): AsyncGenerator<Record<string, any>, void, unknown> {
  const res = await fetch("http://localhost:8000/chat/stream", {
    method: "POST",
    headers: AUTH_HEADERS(),
    body: JSON.stringify(params),
    signal,
  });
  yield* readSSEStream(res);
}

// 生成 PPT 大纲 (SSE)；传入 message_id 则为重新生成（只需 message_id）
export async function* sendPptOutline(
  params: { id?: number; message?: string; doc_ids?: number[]; file_ids?: number[]; message_id?: number },
  signal?: AbortSignal,
): AsyncGenerator<Record<string, any>, void, unknown> {
  const res = await fetch("http://localhost:8000/chat/ppt_outline", {
    method: "POST",
    headers: AUTH_HEADERS(),
    body: JSON.stringify(params),
    signal,
  });
  yield* readSSEStream(res);
}

// 更新 PPT 大纲 (REST)
export async function updateOutline(data: {
  message_id: number;
  outline: { style: any; slides: any[] };
}) {
  const res = await fetch("http://localhost:8000/chat/update_outline", {
    method: "POST",
    headers: AUTH_HEADERS(),
    body: JSON.stringify(data),
  });
  return res.json();
}

// 生成 PPT 幻灯片 (SSE)
export async function* sendPptGenerate(
  params: { id: number; message_id: number },
  signal?: AbortSignal,
): AsyncGenerator<Record<string, any>, void, unknown> {
  const res = await fetch("http://localhost:8000/chat/ppt_generate", {
    method: "POST",
    headers: AUTH_HEADERS(),
    body: JSON.stringify(params),
    signal,
  });
  yield* readSSEStream(res);
}

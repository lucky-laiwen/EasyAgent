import type { WebSearchNewsSchema } from "@/store/store";

interface NewsProps {
  newsData: WebSearchNewsSchema[];
}

const News = ({ newsData }: NewsProps) => {
  if (!newsData || newsData.length === 0) {
    return <div className="text-sm text-gray-400 px-4 py-2">暂无相关新闻</div>;
  }

  return (
    <div className="flex flex-col gap-3 px-2">
      {newsData.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-2 rounded-xl
             p-2 border border-[var(--chat-border)]
             hover:bg-[var(--Ai-content-bg)] transition"
        >
          {/* 第一行：图片 + 标题 */}
          <div className="flex gap-3 items-stretch">
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-30 h-20 object-cover rounded-lg flex-shrink-0"
              />
            )}

            {/* 右侧文本区（关键） */}
            <div className="flex flex-col flex-1 gap-1">
              <h3 className="text-base font-semibold line-clamp-2">
                {item.title}
              </h3>

              {/* 来源 + 时间：稳稳贴底 */}
              <div className="mt-auto flex items-center gap-2 text-xs text-[var(--Ai-think-text)]">
                <span>{item.source}</span>
                <span>·</span>
                <span>{new Date(item.date).toISOString().split("T")[0]}</span>
              </div>
            </div>
          </div>

          {/* 第二行：描述 */}
          <p className="text-sm text-gray-400 line-clamp-2">{item.body}</p>
        </a>
      ))}
    </div>
  );
};

export default News;

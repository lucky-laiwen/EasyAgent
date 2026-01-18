import type { WebSearchItem } from "@/store/store";
interface TextsProps {
  TextsData: WebSearchItem[];
}
const Texts = ({ TextsData }: TextsProps) => {
  if (!TextsData || TextsData.length === 0) {
    return (
      <div className="text-sm text-gray-400 px-4 py-2 w-100% h-100%">
        暂无相关数据
      </div>
    );
  }
  return (
    <div>
      {TextsData.map((tool) => {
        const domain = (() => {
          try {
            return new URL(tool.href).hostname;
          } catch {
            return "";
          }
        })();

        const favicon = domain
          ? `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`
          : "";

        return (
          <a
            key={tool.href}
            href={tool.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[100%] mt-2 p-4 rounded-xl hover:bg-[var(--Ai-content-bg)] transition-all duration-300 border border-[var(--chat-border)] shadow-sm cursor-pointer flex flex-col"
          >
            <div className="flex items-center gap-3 mb-1">
              {favicon && (
                <img
                  src={favicon}
                  alt="icon"
                  className="w-4 h-4 rounded-sm"
                  loading="lazy"
                />
              )}
              <div className="font-semibold text-[var(--Ai-content-text)] line-clamp-1">
                {tool.title}
              </div>
            </div>
            <div className="text-sm text-[var(--Ai-think-text)] line-clamp-3">
              {tool.body}
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default Texts;

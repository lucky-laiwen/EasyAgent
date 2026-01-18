import { useState, useEffect } from "react";
import type { WebSearchImagesSchema } from "@/store/store";

interface ImagesProps {
  imagesData: WebSearchImagesSchema[];
}

const Images = ({ imagesData }: ImagesProps) => {
  const [validImages, setValidImages] = useState<WebSearchImagesSchema[]>([]);

  // 🔑 关键：始终与 imagesData 保持同步
  useEffect(() => {
    setValidImages(imagesData || []);
  }, [imagesData]);

  if (!imagesData || imagesData.length === 0) {
    return <div className="text-sm text-gray-400 px-4 py-2">暂无相关图片</div>;
  }

  if (validImages.length === 0) {
    return <div className="text-sm text-gray-400 px-4 py-2">暂无相关图片</div>;
  }

  const handleImageError = (failedItem: WebSearchImagesSchema) => {
    setValidImages((prev) => prev.filter((item) => item !== failedItem));
  };

  return (
    <div className="px-4 columns-3 gap-4">
      {validImages.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="
            group
            mb-4
            block
            break-inside-avoid
            rounded-xl
            overflow-hidden
            border
            border-gray-200
            hover:shadow-md
            transition
          "
        >
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="w-full h-auto object-cover"
            onError={() => handleImageError(item)}
          />

          <div className="p-2">
            <p className="text-sm text-gray-400 line-clamp-2">{item.title}</p>
            <span className="text-xs text-gray-500 truncate">
              {item.source}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
};

export default Images;

import React, { useEffect, useState } from "react";
import "animate.css";

type Schemas = {
  children?: React.ReactNode;
  className?: string;
  onCancel?: () => void;
  open?: boolean;
  fotter?: React.ReactNode;
  title?: string;
};

const EAModal: React.FC<Schemas> = ({
  children,
  className = "",
  onCancel,
  open = false,
  fotter,
  title,
}) => {
  const [mounted, setMounted] = useState(open);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setAnimatingOut(false);
    } else if (mounted) {
      setAnimatingOut(true);
    }
  }, [open, mounted]);

  const handleAnimationEnd = () => {
    if (animatingOut) setMounted(false);
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[99] flex justify-center items-center"
      style={{ margin: 0, padding: 0 }}
    >
      {/* 背景遮罩 */}
      <div
        className={`absolute inset-0 bg-black/40 animate__animated ${
          animatingOut ? "animate__fadeOut" : "animate__fadeIn"
        }`}
        style={{ animationDuration: "0.4s" }}
        onClick={onCancel}
        onAnimationEnd={handleAnimationEnd}
      ></div>

      {/* Modal 内容 */}
      <div
        className={`relative w-[25%] max-w-full bg-base-300 rounded-lg shadow-lg animate__animated overflow-y-auto ${className} ${
          animatingOut ? "animate__fadeOut" : "animate__fadeIn"
        }`}
        style={{ animationDuration: "0.4s" }}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 pb-0 ">
          <div className="text-lg font-semibold">{title}</div>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 overflow-auto">{children}</div>

        {/* 底部操作 */}
        {fotter && <div className="pb-4 px-4 ">{fotter}</div>}
      </div>
    </div>
  );
};

export default EAModal;

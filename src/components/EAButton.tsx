type Schemas = {
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  text?: string;
  htmlType?: "button" | "submit" | "reset" | undefined;
};

const EAButton = (props: Schemas) => {
  const {
    loading,
    className,
    onClick,
    style,
    text,
    icon,
    htmlType = "button",
  } = props; // ✅ 设置默认值
  return (
    <button
      className={`btn ${
        loading ? "pl-[35px]" : ""
      } ${className} transition-all duration-300 relative`}
      style={style}
      onClick={onClick}
      disabled={loading}
      type={htmlType} // ✅ 始终有值
    >
      <div className="relative">
        {icon}
        <span
          className={`${
            loading
              ? "loading loading-spinner opacity-100 w-[18px] h-[18px]"
              : "opacity-0"
          } transition-all duration-300`}
          style={{
            position: "absolute",
            top: "50%",
            left: "-25px",
            transform: "translateY(-50%)",
          }}
        ></span>
        {text}
      </div>
    </button>
  );
};

export default EAButton;

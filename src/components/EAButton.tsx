type Schemas = {
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  text?: string;
};

const EAButton = (props: Schemas) => {
  const { loading, className, onClick, style, text } = props;
  return (
    <>
      <button
        className={`btn  ${
          loading ? "pl-[35px]" : ""
        } ${className} transition-all duration-300 relative`}
        style={{ ...style }}
        onClick={onClick}
        disabled={loading}
      >
        <div className="relative">
          <span
            className={`${
              loading
                ? " loading loading-spinner opcity-1 w-[18px] h-[18px]"
                : "opcity-0"
            } transition-all duration-300`}
            style={{
              position: "absolute",
              top: "50%",
              left: "-25px",
              transform: "translateY(-60%)",
            }}
          ></span>
          {text}
        </div>
      </button>
    </>
  );
};

export default EAButton;

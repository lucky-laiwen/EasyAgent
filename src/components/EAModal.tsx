import React from "react";

type Schemas = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onCancel?: () => void;
  open?: boolean;
  fotter?: React.ReactNode;
};

const EAModal: React.FC<Schemas> = ({
  children,
  className = "",
  style = {},
  onCancel,
  open = false,
  fotter,
}) => {
  return (
    <>
      {/* Modal开关，根据open属性控制，只读 */}
      <input
        type="checkbox"
        id="my_modal_7"
        checked={open}
        className="modal-toggle"
        readOnly
      />

      {/* Modal内容 */}
      <div className="modal">
        <div className={`modal-box ${className}`} style={style}>
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={onCancel}
            >
              ✕
            </button>
          </form>

          {children}
          {fotter || fotter === null ? (
            fotter
          ) : (
            <div className="modal-action">
              <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn">Close</button>
              </form>
            </div>
          )}
        </div>

        {/* 点击背景关闭 modal */}
        <label
          htmlFor="my_modal_7"
          className="modal-backdrop"
          onClick={onCancel}
        ></label>
      </div>
    </>
  );
};

export default EAModal;

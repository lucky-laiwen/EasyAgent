import { type ReactNode } from "react";
import { message as antdMessage } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import styles from "./EAMessage.module.scss";
let messageApi: MessageInstance | null = null;

/**
 * 在应用根部包裹一次即可
 */
export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [api, contextHolder] = antdMessage.useMessage();
  messageApi = api;

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};

/**
 * 暴露一个全局 message 对象
 * 让使用方式与 antd 一致： message.success("xxx")
 */
const EAMessage = {
  success: (content: string) =>
    messageApi?.open({
      type: "success",
      duration: 3,
      content,
      className: `${styles["ea-message"]}`,
    }),
  error: (content: string) =>
    messageApi?.open({
      type: "error",
      duration: 3,
      content,
      className: `${styles["ea-message"]}`,
    }),
  info: (content: string) =>
    messageApi?.open({
      type: "info",
      duration: 3,
      content,
      className: `${styles["ea-message"]}`,
    }),
  warning: (content: string) =>
    messageApi?.open({
      type: "warning",
      duration: 3,
      content,
      className: `${styles["ea-message"]}`,
    }),
  loading: (content: string) =>
    messageApi?.open({
      type: "loading",
      duration: 3,
      content,
      className: `${styles["ea-message"]}`,
    }),
};

export default EAMessage;

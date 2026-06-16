import { getUserInfoApi } from "@/api/user";
import EAButton from "@/components/EAButton";
import { useStore, type SystemInfoSchema, type User } from "@/store/store";
import { Avatar, Empty } from "antd";
import { useEffect, useRef, useState } from "react";

interface SystemMessageProps {
  formatDate: (date: string) => string;
  getFriendListApi: () => void;
}

const SystemMessage: React.FC<SystemMessageProps> = ({
  formatDate,
  getFriendListApi,
}) => {
  const socketRef = useStore((state) => state.socket);
  const systemInfo = useStore((state) => state.systemInfo);
  const [userInfoMap, setUserInfoMap] = useState<Record<number, User>>({});
  const list = [...(systemInfo || [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const unreadCount = list.filter((x) => x.is_read === 0).length;
  const systemListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const sourceIds = Array.from(new Set(list.map((item) => item.source_id)));
    const missingIds = sourceIds.filter((id) => !userInfoMap[id]);

    if (missingIds.length === 0) {
      return;
    }

    const fetchMissingUsers = async () => {
      const fetchedUsers: User[] = [];

      for (const id of missingIds) {
        try {
          const res = await getUserInfoApi(id);
          if (res.success) {
            fetchedUsers.push(res.data as User);
          }
        } catch (err) {
          console.error("getUserInfoApi error:", err);
        }
      }

      if (cancelled || fetchedUsers.length === 0) {
        return;
      }

      setUserInfoMap((prev) => {
        const next = { ...prev };
        for (const user of fetchedUsers) {
          next[user.id] = user;
        }
        return next;
      });
    };

    void fetchMissingUsers();

    return () => {
      cancelled = true;
    };
  }, [list, userInfoMap]);
  // 接受好友请求
  const acceptFriendRequest = async (
    sysMsg: SystemInfoSchema,
    accept: boolean,
  ) => {
    socketRef?.send(
      JSON.stringify({
        type: "accept_friend_request",
        to_user_id: sysMsg.source_id,
        message_id: sysMsg.id,
        action_type: accept ? 1 : 2,
        title: accept ? "接受好友请求" : "拒绝好友请求",
        content: accept ? "您已接受好友请求" : "您已拒绝好友请求",
      }),
    );
    getFriendListApi();
  };

  const renderSystemInfoItem = (info: SystemInfoSchema) => {
    const isUnread = info.is_read === 0;
    const userInfoItem = userInfoMap[info.source_id];
    return (
      <div
        key={info.id}
        className={[
          "group relative w-full rounded-xl border p-3 transition",
          "hover:shadow-sm hover:-translate-y-[1px]",
          isUnread ? "ring-1 ring-primary/15" : "opacity-90",
        ].join(" ")}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold truncate">{info.title}</div>
              <time className="ml-auto text-[11px] opacity-60 whitespace-nowrap">
                {formatDate(info.created_at)}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Avatar src={userInfoItem?.avatar} />
              <div className="flex flex-col">
                <div className="text-sm font-semibold truncate">
                  {userInfoItem?.name}
                </div>
                <div className="text-xs opacity-60 whitespace-nowrap">
                  {userInfoItem?.email}
                </div>
              </div>
            </div>

            <div className="text-xs opacity-80 mt-1 whitespace-pre-wrap break-words">
              {info.content}
            </div>
            {/* 需要操作 */}
            {info.action_type !== undefined && info.action_type === 0 && (
              <div className="mt-2 opacity-60 flex gap-2">
                <EAButton
                  text="接受"
                  onClick={() => acceptFriendRequest(info, true)}
                />
                <EAButton
                  text="拒绝"
                  onClick={() => acceptFriendRequest(info, false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <div className="font-semibold">系统消息</div>
        <span className="text-xs opacity-60">
          共 {list.length} 条{unreadCount ? `，未读 ${unreadCount} 条` : ""}
        </span>
      </div>

      <div ref={systemListRef} className="flex-1 overflow-y-auto p-4">
        {list.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Empty description="" />
            <p>暂无系统消息</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((item) => renderSystemInfoItem(item))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMessage;

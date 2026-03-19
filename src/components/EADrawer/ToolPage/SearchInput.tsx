import { debounce } from "lodash";
import { useMemo, useEffect, useState } from "react";
import { searchFriend, addFriend } from "@/api/userFriend";
import EAButton from "@/components/EAButton";
import { useRef } from "react";
import { useStore } from "@/store/store";

interface UserSchema {
  id: number;
  name: string;
  email: string;
  created_at: string;
  avatar: string;
}

interface SearchResult {
  mutual_friends: UserSchema[];
  non_mutual_friends: UserSchema[];
  pending_mutual_friends: UserSchema[];
}

interface SearchInputProps {
  getFriendListApi: () => void;
}

const SearchInput = ({ getFriendListApi }: SearchInputProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult>();
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const socketRef = useStore((state) => state.socket);
  const debouncedSearch = useMemo(() => {
    return debounce(async (value: string) => {
      if (!value.trim()) {
        setSearchResult(undefined);
        return;
      }
      setLoading(true);
      const res = await searchFriend({ friend_name: value });
      if (res.data.success) {
        setSearchResult(res.data.data);
        setLoading(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleAddFriend = async (id: number) => {
    setBtnLoading(true);
    const res = await addFriend({ friend_id: id });
    if (res.data.success) {
      setBtnLoading(false);
      debouncedSearch(searchValue);
      socketRef?.send(
        JSON.stringify({
          to_user_id: id,
          type: "add_friend",
          content: res.data.data,
        }),
      );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`dropdown dropdown-left ${open ? "dropdown-open" : ""}`}
    >
      <div>
        <div className="px-4 py-2 !bg-[var(--Ai-think-bg)]">
          <label className="input bg-transparent">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input
              type="search"
              placeholder="搜索"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                debouncedSearch(e.target.value);
              }}
              onFocus={() => setOpen(true)}
            />
          </label>
        </div>
      </div>

      {searchValue && (
        <ul className="dropdown-content menu mr-4 mt-[auto] bg-base-100 rounded-box w-80 p-2 shadow-sm z-10">
          {loading ? (
            <span className="loading loading-spinner loading-xl mx-[auto]"></span>
          ) : (
            <>
              {/* 待确认 */}
              {searchResult?.pending_mutual_friends &&
                searchResult.pending_mutual_friends.length > 0 && (
                  <>
                    <li className="menu-title">
                      <span>待确认</span>
                    </li>
                    {searchResult.pending_mutual_friends.map((user) => (
                      <div key={user.id} className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-8 h-8">
                              <img src={user.avatar} alt={user.name} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-gray-400">
                                  {user.email}
                                </p>
                              </div>
                              <span className="text-xs text-info">
                                等待对方同意
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              {/* 好友 */}
              {searchResult?.mutual_friends &&
                searchResult.mutual_friends.length > 0 && (
                  <>
                    <li className="menu-title">
                      <span>好友</span>
                    </li>
                    {searchResult.mutual_friends.map((user) => (
                      <div key={user.id} className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-8 h-8">
                              <img src={user.avatar} alt={user.name} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-gray-400">
                                  {user.email}
                                </p>
                              </div>
                              <span className="text-xs text-success">
                                已添加
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

              {/* 可添加 */}
              {searchResult?.non_mutual_friends &&
                searchResult.non_mutual_friends.length > 0 && (
                  <>
                    <li className="menu-title mt-2">
                      <span>可添加</span>
                    </li>
                    {searchResult.non_mutual_friends.map((user) => (
                      <div key={user.id} className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-8 h-8">
                              <img src={user.avatar} alt={user.name} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-gray-400">
                                  {user.email}
                                </p>
                              </div>
                              <EAButton
                                loading={btnLoading}
                                className="px-2 h-[100%]"
                                text="添加"
                                onClick={() => handleAddFriend(user.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

              {/* 空状态 */}
              {searchResult &&
                searchResult.mutual_friends &&
                searchResult.non_mutual_friends &&
                searchResult.pending_mutual_friends &&
                searchResult.pending_mutual_friends.length === 0 &&
                searchResult.mutual_friends.length === 0 &&
                searchResult.non_mutual_friends.length === 0 && (
                  <li className="text-center text-sm text-gray-400 py-2">
                    未搜索到用户
                  </li>
                )}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchInput;

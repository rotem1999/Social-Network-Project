"use client";

import { PlusIcon, XIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { CHAT_URL, SOCKET_URL } from "@/lib/Api";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ChatCard from "@/components/ChatCard";
import UserAutocomplete from "@/components/UserAutocomplete";

const Chat = () => {
  const { user, token } = useAuth();
  const uid = user?.id || user?._id;

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [mode, setMode] = useState("direct");
  const [directName, setDirectName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupPicked, setGroupPicked] = useState([]);
  const [groupQuery, setGroupQuery] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [onlineIds, setOnlineIds] = useState([]);
  const [typingIds, setTypingIds] = useState([]);

  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const socketRef = useRef(null);
  const activeIdRef = useRef(null);
  const bottomRef = useRef(null);

  const loadConversation = () => {
    axios
      .post(CHAT_URL, { command: "conversations", data: {} })
      .then((res) => setConversations(res.data.conversations || []))
      .catch(() => setError("Could not load conversations"));
  };

  useEffect(() => {
    loadConversation();
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("newMessage", (message) => {
      if (message.conversation === activeIdRef.current) {
        setMessages((ms) => [...ms, message]);
      }
      loadConversation();
    });
    socket.on("connect_error", () => setError("Chat connection failed"));

    socket.on("onlineUsers", (ids) => setOnlineIds(ids));
    socket.on("presence", ({ userId, online }) =>
      setOnlineIds((ids) =>
        online
          ? [...new Set([...ids, userId])]
          : ids.filter((id) => id !== userId),
      ),
    );

    socket.on("typing", ({ conversationId, userId, isTyping }) => {
      if (conversationId !== activeIdRef.current) return;
      setTypingIds((ids) =>
        isTyping
          ? [...new Set([...ids, userId])]
          : ids.filter((id) => id !== userId),
      );
    });

    return () => socket.disconnect();
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatAction = async (command, data = {}) => {
    setBusy(true);
    setError("");

    try {
      const res = await axios.post(CHAT_URL, { command, data });
      await loadConversation();

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const openConversation = async (id) => {
    setActiveId(id);
    activeIdRef.current = id;
    setTypingIds([]);

    try {
      const res = await axios.post(CHAT_URL, {
        command: "messages",
        data: { conversationId: id },
      });
      setMessages([...(res.data.messages || [])].reverse());
    } catch {
      setError("Could not load messages");
    }
  };

  const startDirect = async (e) => {
    e.preventDefault();
    if (!directName.trim()) return;
    const out = await chatAction("start", { username: directName.trim() });
    if (out?.conversation) {
      setDirectName("");
      setNewOpen(false);
      openConversation(out.conversation._id);
    }
  };

  const startGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || groupPicked.length === 0) return;

    const out = await chatAction("startGroup", {
      name: groupName.trim(),
      usernames: groupPicked,
    });

    if (out?.conversation) {
      setGroupName("");
      setGroupPicked([]);
      setGroupQuery("");
      setNewOpen(false);
      openConversation(out.conversation._id);
    }
  };

  const togglePin = (convo) =>
    chatAction(convo.pinned ? "unpin" : "pin", { conversationId: convo._id });

  const removeChat = async (convo) => {
    if (!confirm("delete this chat?")) return;

    await chatAction("delete", { conversationId: convo._id });
    if (convo._id === activeId) {
      setActiveId(null);
      activeIdRef.current = null;
      setMessages([]);
    }
  };

  const leaveGroup = async () => {
    if (
      !confirm(
        "are you sure you want to leave this group? this action is not reversible",
      )
    )
      return;

    await chatAction("leave", { conversationId: activeId });
    setActiveId(null);
    activeIdRef.current = null;
    setMessages([]);
  };

  const addMemeber = async (e) => {
    e.preventDefault();
    if (!inviteName.trim()) return;

    const out = await chatAction("addMember", {
      conversationId: activeId,
      username: inviteName.trim(),
    });
    if (out) setInviteName("");
  };

  const emitTyping = (isTyping) => {
    if (!activeIdRef.current) return;
    isTypingRef.current = isTyping;
    socketRef.current?.emit("typing", {
      conversationId: activeIdRef.current,
      isTyping,
    });
  };

  const handleDraft = (e) => {
    setDraft(e.target.value);
    if (!isTypingRef.current) emitTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping(false), 1500);
  };

  const send = (e) => {
    e.preventDefault();
    clearTimeout(typingTimerRef.current);
    emitTyping(false);
    const content = draft.trim();
    if (!content || !activeId) return;

    socketRef.current?.emit(
      "sendMessage",
      {
        conversationId: activeId,
        content,
      },
      (ack) => {
        if (ack?.error) setError(ack.error);
      },
    );
    setDraft("");
  };

  const active = conversations.find((c) => c._id === activeId);
  const pinnedCount = conversations.filter((c) => c.pinned).length;
  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);

  const timeOf = (value) => {
    if (!value) return "";
    const stamp = new Date(value);
    const today = new Date().toDateString() === stamp.toDateString();
    const clock = stamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return today
      ? clock
      : stamp.toLocaleDateString([], { day: "numeric", month: "short" }) +
          " " +
          clock;
  };

  const otherId = (convo) =>
    convo.participants?.map((p) => p._id || p).find((id) => id !== uid);

  const onlineCount = (convo) =>
    convo.participants?.filter(
      (p) => (p._id || p) !== uid && onlineIds.includes(p._id || p),
    ).length || 0;

  const titleOf = (convo) =>
    convo.isGroup
      ? convo.name
      : "u/" +
        (convo.participants?.find((p) => (p._id || p) !== uid)?.username ||
          "unknown");

  return (
    <div className="mx-auto max-w-4xl">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex h-[calc(100vh-8rem)] gap-3">
        <div className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Chats</h2>
            <button
              onClick={() => setNewOpen((o) => !o)}
              title="New Chat"
              className="rounded-full bg-orange-600 p-1 text-white transition hover:bg-orange-700 hover:cursor-pointer"
            >
              {newOpen ? <XIcon size={14} /> : <PlusIcon size={14} />}
            </button>
          </div>

          {newOpen && (
            <div className="space-y-2 rounded-lg border p-2">
              <div className="flex gap-1 text-xs">
                <button
                  onClick={() => setMode("direct")}
                  className={
                    "flex-1 rounded-full px-2 py-1 transition hover:cursor-pointer " +
                    (mode === "direct" ? "bg-gray-200" : "hover:bg-gray-100")
                  }
                >
                  Direct
                </button>
                <button
                  onClick={() => setMode("group")}
                  className={
                    "flex-1 rounded-full px-2 py-1 transition hover:cursor-pointer " +
                    (mode === "group" ? "bg-gray-200" : "hover:bg-gray-100")
                  }
                >
                  Group
                </button>
              </div>
              {mode === "direct" ? (
                <form onSubmit={startDirect} className="space-y-1">
                  <UserAutocomplete
                    term={directName}
                    setTerm={setDirectName}
                    onPick={(one) => setDirectName(one.username)}
                    placeholder="username"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-orange-600 px-3 py-1 text-xs text-white disabled:opacity-50 hover:cursor-pointer"
                  >
                    Start chat
                  </button>
                </form>
              ) : (
                <form onSubmit={startGroup} className="space-y-1">
                  <input
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  {groupPicked.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {groupPicked.map((name) => (
                        <span
                          key={name}
                          className="flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs"
                        >
                          u/{name}
                          <button
                            type="button"
                            onClick={() =>
                              setGroupPicked((names) =>
                                names.filter((one) => one !== name),
                              )
                            }
                            className="text-gray-500 transition hover:text-red-600 hover:cursor-pointer"
                          >
                            <XIcon size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <UserAutocomplete
                    term={groupQuery}
                    setTerm={setGroupQuery}
                    onPick={(one) => {
                      setGroupPicked((names) => [...names, one.username]);
                      setGroupQuery("");
                    }}
                    placeholder="add members..."
                    exclude={groupPicked}
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-orange-600 px-3 py-1 text-xs text-white disabled:opacity-50 hover:cursor-pointer"
                  >
                    Create group
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto border-t pt-2">
            {conversations.length === 0 && (
              <p className="text-xs text-gray-500">No Conversations yet...</p>
            )}

            {pinned.length > 0 && (
              <p className="px-1 text-[10px] font-medium text-gray-400">
                PINNED {pinnedCount}/3
              </p>
            )}
            {pinned.map((convo) => (
              <ChatCard
                key={convo._id}
                convo={convo}
                uid={uid}
                isActive={convo._id === activeId}
                onOpen={openConversation}
                onTogglePin={togglePin}
                onDelete={removeChat}
                busy={busy}
              />
            ))}

            {pinned.length > 0 && unpinned.length > 0 && (
              <p className="px-1 pt-1 text-[10px] font-medium text-gray-400">
                ALL CHATs
              </p>
            )}
            {unpinned.map((convo) => (
              <ChatCard
                key={convo._id}
                convo={convo}
                uid={uid}
                isActive={convo._id === activeId}
                onOpen={openConversation}
                onTogglePin={togglePin}
                onDelete={removeChat}
                busy={busy}
              />
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col rounded-xl border">
          {!active ? (
            <p className="m-auto text-sm text-gray-500">
              Select a conversation to start chatting
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between border-b px-4 py-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{titleOf(active)}</p>
                  {active.isGroup ? (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      {active.participants?.length} members
                      {onlineCount(active) > 0 && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          {onlineCount(active)} online
                        </>
                      )}
                      {active.isAdmin && " • you are admin"}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <span
                        className={
                          "h-2 w-2 rounded-full " +
                          (onlineIds.includes(otherId(active))
                            ? "bg-green-500"
                            : "bg-gray-300")
                        }
                      />
                      {onlineIds.includes(otherId(active))
                        ? "online"
                        : "offline"}
                    </p>
                  )}
                </div>

                {active.isGroup && !active.isAdmin && (
                  <button
                    onClick={leaveGroup}
                    disabled={busy}
                    className="rounded-full border px-3 py-1 text-xs transition hover:bg-gray-100 disabled:opacity-50 hover:cursor-pointer"
                  >
                    Leave
                  </button>
                )}
              </div>

              {active.isGroup && active.isAdmin && (
                <form
                  onSubmit={addMemeber}
                  className="flex gap-2 border-b px-4 py-2"
                >
                  <div className="w-full">
                    <UserAutocomplete
                      term={inviteName}
                      setTerm={setInviteName}
                      onPick={(one) => setInviteName(one.username)}
                      placeholder="add member by username..."
                      exclude={
                        active.participants?.map((one) => one.username) || []
                      }
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full border px-3 py-1 text-xs transition hover:bg-gray-100 disabled:opacity-50 hover:cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((message) => {
                  const mine = (message.sender?._id || message.sender) === uid;

                  return (
                    <div
                      key={message._id}
                      className={mine ? "text-right" : "text-left"}
                    >
                      {active.isGroup && !mine && (
                        <p className="text-[10px] text-gray-400">
                          u/{message.sender?.username}
                        </p>
                      )}
                      <span
                        className={
                          "inline-block max-w-[75%] rounded-2xl px-3 py-1.5 text-sm " +
                          (mine
                            ? "bg-orange-600 text-white"
                            : "bg-gray-100 text-gray-800")
                        }
                      >
                        {message.content}
                      </span>
                      <p className="text-[10px] text-gray-400">
                        {timeOf(message.createdAt)}
                      </p>
                    </div>
                  );
                })}
                {typingIds.length > 0 && (
                  <div className="text-left">
                    <span className="inline-flex items-center gap-1 rounded-2xl bg-gray-100 px-3 py-2">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </span>
                    {active.isGroup && (
                      <p className="text-[10px] text-gray-400">
                        {typingIds
                          .map(
                            (id) =>
                              active.participants?.find(
                                (p) => (p._id || p) === id,
                              )?.username,
                          )
                          .filter(Boolean)
                          .join(", ")}{" "}
                        typing...
                      </p>
                    )}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex gap-2 border-t p-3">
                <input
                  className="w-full rounded-full border px-4 py-1.5 text-sm"
                  placeholder="Message..."
                  value={draft}
                  onChange={handleDraft}
                />
                <button
                  type="submit"
                  className="rounded-full bg-orange-600 px-4 py-1.5 text-sm text-white transition hover:bg-orange-700 hover:cursor-pointer"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

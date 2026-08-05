"use client";
import { PinIcon, TrashIcon } from "@/components/Icons";

const ChatCard = ({
  convo,
  uid,
  isActive,
  onOpen,
  onTogglePin,
  onDelete,
  busy,
}) => {
  const title = convo.isGroup
    ? convo.name
    : "u/" +
      (convo.participants?.find((p) => (p._id || p) !== uid)?.username ||
        "unknown");

  const preview = convo.lastMessage
    ? (convo.lastMessage.sender === uid ? "You: " : "") +
      convo.lastMessage.content
    : "No messages yet";

  const canDelete = !convo.isGroup || convo.isAdmin;

  return (
    <div
      onClick={() => onOpen(convo._id)}
      className={
        "group flex cursor-pointer items-start gap-2 rounded-xl border p-2 transition hover:bg-gray-50 " +
        (isActive ? "border-orange-400 bg-orange-50" : "")
      }
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {convo.pinned && <PinIcon size={12} className="text-orange-600" />}
          <p className="truncate text-sm font-medium">{title}</p>
          {convo.isGroup && (
            <span className="text-[10px] text-gray-400">group</span>
          )}
        </div>
        <p className="truncate text-xs text-gray-500">{preview}</p>
      </div>

      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(convo);
          }}
          disabled={busy}
          title={convo.pinned ? "Unpin" : "Pin"}
          className={
            "rounded p-1 transition hover:bg-gray-200 disabled:opacity-50 hover:cursor-pointer " +
            (convo.pinned ? "text-orange-600" : "text-gray-400")
          }
        >
          <PinIcon size={14} />
        </button>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(convo);
            }}
            disabled={busy}
            title="Delete chat"
            className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 hover:cursor-pointer"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatCard;

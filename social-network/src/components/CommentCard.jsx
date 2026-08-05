"use client";
import { useState } from "react";
import axios from "axios";
import { COMMENTS_URL } from "@/lib/Api";
import { UpArrow, DownArrow, KebabIcon } from "./Icons";
import AddComment from "./AddComment";

const CommentCard = ({
  comment,
  postId,
  currentUserId,
  onAdded,
  onDeleted,
  onUpdated,
}) => {
  const author = comment.author || {};
  const isOwner = currentUserId === author._id;

  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState(comment.content);
  const [busy, setBusy] = useState(false);

  const [score, setScore] = useState(comment.score || 0);
  const [myVote, setMyVote] = useState(comment.myVote || 0);

  const vote = async (dir) => {
    const prevVote = myVote;
    const prevScore = score;
    const next = myVote === dir ? 0 : dir;
    setMyVote(next);
    setScore((s) => s + (next - myVote));
    try {
      await axios.post(COMMENTS_URL, {
        command: "vote",
        data: { commentId: comment._id, value: next },
      });
    } catch {
      setMyVote(prevVote);
      setScore(prevScore);
    }
  };

  const save = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await axios.post(COMMENTS_URL, {
        command: "update",
        data: { commentId: comment._id, content: text.trim() },
      });
      onUpdated?.(res.data.comment);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      await axios.post(COMMENTS_URL, {
        command: "delete",
        data: { commentId: comment._id },
      });
      onDeleted?.(comment._id);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          u/{author.username || "unknown"}
        </span>

        {isOwner && !editing && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Comment options"
              className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:cursor-pointer"
            >
              <KebabIcon size={16} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-28 overflow-hidden rounded-lg border bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm transition hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      remove();
                    }}
                    disabled={busy}
                    className="block w-full px-3 py-1.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-1 space-y-2">
          <textarea
            className="w-full rounded border p-2"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="rounded-full bg-orange-600 px-3 py-1 text-xs text-white disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setText(comment.content);
              }}
              className="rounded-full border px-3 py-1 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-gray-800">{comment.content}</p>
      )}

      {!editing && (
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <button
              onClick={() => vote(1)}
              aria-label="Upvote"
              className={
                "hover:cursor-pointer " +
                (myVote === 1 ? "text-orange-600" : "hover:text-gray-800")
              }
            >
              <UpArrow size={14} />
            </button>
            <span className="min-w-[1rem] text-center">{score}</span>
            <button
              onClick={() => vote(-1)}
              aria-label="Downvote"
              className={
                "hover:cursor-pointer " +
                (myVote === -1 ? "text-blue-600" : "hover:text-gray-800")
              }
            >
              <DownArrow size={14} />
            </button>
          </span>
          <button
            onClick={() => setReplying((r) => !r)}
            className="hover:cursor-pointer hover:underline"
          >
            Reply
          </button>
        </div>
      )}

      {replying && (
        <div className="mt-2">
          <AddComment
            postId={postId}
            parentId={comment._id}
            compact
            autoFocus
            placeholder="Write a reply..."
            onAdded={(c) => {
              onAdded?.(c);
              setReplying(false);
            }}
          />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="ml-4 border-l pl-4">
          {comment.replies.map((child) => (
            <CommentCard
              key={child._id}
              comment={child}
              postId={postId}
              currentUserId={currentUserId}
              onAdded={onAdded}
              onDeleted={onDeleted}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentCard;

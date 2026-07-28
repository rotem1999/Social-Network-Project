"use client";
import { useState } from "react";
import axios from "axios";
import { COMMENTS_URL } from "@/lib/Api";
import { useAuth } from "@/context/AuthContext";

const Comment = ({ comment, onDeleted, onUpdated }) => {
  const { user } = useAuth();
  const author = comment.author || {};
  const isOwner = (user?.id || user?._id) === author._id;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.content);
  const [busy, setBusy] = useState(false);

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
    <div className="border-b py-2 text-sm last:border-0">
      <div className="mb-0.5 text-xs text-gray-500">
        u/{author.username || "unknown"}
      </div>
      {editing ? (
        <div className="space-y-2">
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
        <>
          <p className="whitespace-pre-wrap text-gray-800">{comment.content}</p>
          {isOwner && (
            <div className="mt-1 flex gap-3 text-xs text-gray-500">
              <button
                onClick={() => setEditing(true)}
                className="hover:underline"
              >
                Edit
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Comment;

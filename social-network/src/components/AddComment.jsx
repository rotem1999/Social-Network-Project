"use client";
import { useState } from "react";
import axios from "axios";
import { COMMENTS_URL } from "@/lib/Api";

const AddComment = ({
  postId,
  parentId = null,
  onAdded,
  compact = false,
  autoFocus = false,
  placeholder = "Add a commnet",
}) => {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setPosting(true);
    setError("");
    try {
      const res = await axios.post(COMMENTS_URL, {
        command: "insert",
        data: { postId, parentId, content: text.trim() },
      });
      onAdded?.(res.data.comment);
      setText("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not add comment at this time",
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={submit} className={compact ? "" : "rounded-xl border p-3"}>
      {error && <p className="mb-1 text-xs text-red-600">{error}</p>}
      <textarea
        className="w-full rounded border p-2 text-sm"
        rows={compact ? 2 : 3}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={posting || !text.trim()}
        className="mt-2 rounded-full bg-orange-600 px-4 py-1.5 text-sm text-white transition disabled:opacity-50"
      >
        {posting ? "Posting..." : compact ? "Reply" : "Comment"}
      </button>
    </form>
  );
};

export default AddComment;

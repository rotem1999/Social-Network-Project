"use client";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { POSTS_URL } from "@/lib/Api";

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .post(POSTS_URL, { command: "select", data: { postId } })
      .then((res) => {
        setTitle(res.data.post.title);
        setContent(res.data.post.content || "");
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load post"),
      )
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await axios.post(POSTS_URL, {
        command: "update",
        data: { postId, title: title.trim(), content: content.trim() },
      });
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update post");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="py-10 text-center text-sm text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Edit post</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-2xl border p-6"
      >
        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <input
          className="w-full rounded-lg border p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border p-2 text-sm"
          rows={5}
          placeholder="Text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
};

export default EditPost;

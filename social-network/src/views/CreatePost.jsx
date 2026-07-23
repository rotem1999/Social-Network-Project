"use client";

import { POSTS_URL } from "@/lib/Api";
import { UploadMedia } from "@/lib/UploadMedia";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
  const ACCEPTED = ["image/jpeg", "image/png", "video/mp4"];
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [group, setGroup] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  const onPick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPEG/PNG images and MP4 videos are allowed");
      return;
    }

    setError("");
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !group.trim()) {
      setError("Title and group are required");
      return;
    }

    if (!content.trim() && !file) {
      setError("Add some text or media");
      return;
    }

    setSubmitting(true);
    try {
      let media = "";
      let mediaType = "";
      if (file) {
        const uploaded = await UploadMedia(file);
        media = uploaded.media;
        mediaType = uploaded.mediaType;
      }

      await axios.post(POSTS_URL, {
        command: "insert",
        data: {
          title: title.trim(),
          content: content.trim(),
          group: group.trim(),
          media,
          mediaType,
        },
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <input
        className="w-full rounded border p-2"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="Group name"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
      />
      <textarea
        className="w-full rounded border p-2"
        rows={4}
        placeholder="Text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <input
        type="file"
        accept="image/jpeg,image/png,video/mp4"
        onChange={onPick}
      />

      {preview &&
        file &&
        (file.type.startsWith("video/") ? (
          <video
            src={preview}
            controls
            className="max-h-60 w-full rounded-lg border"
          />
        ) : (
          <img
            src={preview}
            alt="preview"
            className="max-h-60 w-full rounded-lg border object-cover"
          />
        ))}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Post"}
      </button>
    </form>
  );
};

export default CreatePost;

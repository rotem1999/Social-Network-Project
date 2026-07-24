"use client";

import GroupIcon from "@/components/GroupIcon";
import { GROUPS_URL } from "@/lib/Api";
import { UploadMedia } from "@/lib/UploadMedia";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateGroup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onPickIcon = (e) => {
    const file = e.target.files[0];
    if (!f) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Group icon must be a JPEG or PNG image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Group icon must be under 2 MB");
      return;
    }
    setError("");
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const groupName = name.trim();
    if (!groupName) return "Group name is required";

    if (groupName.length < 3) return "Group name must be at least 3 characters";

    if (!/^[a-z0-9_]+$/i.test(groupName))
      return "Group name can only contain letters, numbers and undescores";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");

    setSubmitting(true);

    try {
      let icon = "";
      if (iconFile) {
        const uploaded = await UploadMedia(iconFile);
        icon = uploaded.media;
      }

      const res = await axios.post(GROUPS_URL, {
        command: "insert",
        data: {
          name: name.trim(),
          description: description.trim(),
          isPrivate,
          icon,
        },
      });

      navigate("/g/" + res.data.group.name);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-2xl font-bald">Create Group</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border p-6"
      >
        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center gap-4">
          <GroupIcon src={iconPreview} size={64} />
          <label className="cursor-pointer rounded-full border px-4 py-2 text-sm transition hover:bg-gray-100">
            Choose icon
            <input
              type="file"
              accept="image/jpeg, image/png"
              onChange={onPickIcon}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripiton</label>
          <textArea
            className="w-full rounded-lg border p-2 text-sm"
            rows={3}
            placeholder="What is this group about?..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private Group (Only members can see posts)
        </label>
      </form>
    </div>
  );
};

export default CreateGroup;

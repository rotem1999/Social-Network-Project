const mongoose = require("mongoose");

const PostSchema = {
  title: { type: String, required: true },
  content: { type: String, default: "" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  createdAt: { type: Date, default: Date.now },
  media: { type: String, default: "" },
  mediaType: { type: String, enum: ["", "image", "video"], default: "" },
};

module.exports = { PostSchema };

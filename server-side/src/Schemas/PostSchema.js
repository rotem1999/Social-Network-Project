const mongoose = require("mongoose");

const PostSchema = {
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  createdAt: { type: Date, default: Date.now },
};

module.exports = { PostSchema };

const mongoose = require("mongoose");

const CommentSchema = {
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  upvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downvoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
};

module.exports = { CommentSchema };

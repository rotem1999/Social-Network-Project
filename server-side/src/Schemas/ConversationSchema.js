const mongoose = require("mongoose");

const ConversationSchema = {
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
};

module.exports = { ConversationSchema };

const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const initChatToken = (server, { Conversation, Message }) => {
  const io = new Server(server, { cors: { origin: "*" } });

  io.use((socket, next) => {
    try {
      const payload = jwt.verify(
        socket.handshake.auth?.token,
        process.env.JWT_SECRET,
      );

      socket.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(String(socket.userId));

    socket.on("sendMessage", async ({ conversationId, content }, ack) => {
      try {
        if (!content?.trim()) return ack?.({ error: "empty message" });

        const convo = await Conversation.findById(conversationId);
        if (
          !convo ||
          !convo.participants.some((id) => id.equals(socket.userId))
        ) {
          return ack?.({ error: "not allowed" });
        }

        const message = await Message.create({
          conversation: convo._id,
          sender: socket.userId,
          content: content.trim(),
        });
        convo.lastMessageAt = message.createdAt;

        await convo.save();
        await message.populate("sender", "username firstName lastName");

        convo.participants.forEach((id) =>
          io.to(String(id)).emit("newMessage", message),
        );

        ack?.({ ok: true, message });
      } catch {
        ack?.({ error: "Server error" });
      }
    });
  });

  return io;
};

module.exports = { initChatToken };

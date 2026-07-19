const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { UserSchema } = require("./Schemas/UserSchema");

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema(UserSchema);

const User = mongoose.model("User", userSchema);

app.post("/api/users", async (req, res) => {
  const { command, body } = req.body;

  try {
    switch (command) {
      case "insert":
        const newUser = new User({
          name: data.name,
          email: data.email,
        });
        await newUser.save();

        return res.json({
          message: "user inserted successfuly",
          user: newUser,
        });

      case "select":
        const users = await User.find({});

        return res.json({
          message: "User fetched",
          users,
        });

      case "update":
        const updateUser = await User.findByIdAndUpdate(
          data.userId,
          { email: data.newEmail },
          { new: true },
        );
        if (!updateUser) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.json({ message: "User Updated", user: updateUser });

      case "delete":
        const deleteUser = User.findByIdAndDelete(data.userId);
        if (!deleteUser) {
          return res.status(404).json({ message: "user not found" });
        }

        return res.json({ message: "user deleted" });

      default:
        return res.status(400).json({ message: "unknown command" });
    }
  } catch (err) {
    console.log(err);

    return res.status(500).json({ message: "server error" });
  }
});

const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
  console.log(`server running on port:` + PORT);
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { UserSchema } = require("./Schemas/UserSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;
const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema(UserSchema);
const User = mongoose.model("User", userSchema);

const verifyToken = async (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);

    return await User.findById(payload.userId);
  } catch (err) {
    return null;
  }
};

const checkIfLoggedIn = async (req, res) => {
  const verified = await verifyToken(req);
  if (!verified) {
    res.status(401).json({ message: "not logged in" });
    return null;
  }
  return verified;
};

app.post("/api/users", async (req, res) => {
  const { command, data } = req.body;

  try {
    switch (command) {
      case "login":
        if (!data.username || !data.password) {
          return res
            .status(400)
            .json({ message: "Username or Password cannot be empty" });
        }

        const user = await User.findOne({ username: data.username });
        if (!user) {
          return res
            .status(401)
            .json({ message: "wrong username or password" });
        }

        const passwordOk = await bcrypt.compare(data.password, user.password);
        if (!passwordOk) {
          return res
            .status(401)
            .json({ message: "wrong username or password" });
        }

        const token = jwt.sign(
          { userId: user._id, username: user.username },
          process.env.JWT_SECRET,
          {
            expiresIn: "2h",
          },
        );

        return res.json({
          message: "Login successful",
          token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
          },
        });

      case "insert":
        if (
          !data.firstName ||
          !data.lastName ||
          !data.email ||
          !data.username ||
          !data.password
        ) {
          return res.status(400).json({
            message:
              "firstName, lastName, email, username, password are required fields",
          });
        }

        const exists = await User.findOne({ username: data.username });
        if (exists) {
          return res.status(409).json({ message: "Username Taken" });
        }

        const newUser = new User({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          username: data.username,
          password: await bcrypt.hash(data.password, saltRounds),
        });
        await newUser.save();

        return res.json({
          message: "user inserted successfuly",
          user: {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            username: newUser.username,
          },
        });

      case "select": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        return res.json({
          message: "User fetched",
          user: await User.findById(caller._id).select("-password"),
        });
      }

      case "update": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        const updates = {
          firstName: data.firstName || caller.firstName,
          lastName: data.lastName || caller.lastName,
          email: data.email || caller.email,
          password: data.password
            ? await bcrypt.hash(data.password, saltRounds)
            : caller.password,
        };

        if (updates.email !== caller.email) {
          const emailTaken = await User.findOne({ email: updates.email });
          if (emailTaken) {
            return res.status(409).json({ message: "email already taken" });
          }
        }

        const updateUser = await User.findByIdAndUpdate(caller._id, updates, {
          new: true,
        }).select("-password");

        return res.json({ message: "User Updated", user: updateUser });
      }

      case "delete": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        await User.findByIdAndDelete(caller._id);

        return res.json({ message: "user deleted" });
      }

      default:
        return res.status(400).json({ message: "unknown command" });
    }
  } catch (err) {
    console.log(err);

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "username or email already taken" });
    }

    return res.status(500).json({ message: "server error" });
  }
});

app.post("/api/groups", async (req, res) => {});

const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
  console.log(`server running on port:` + PORT);
});

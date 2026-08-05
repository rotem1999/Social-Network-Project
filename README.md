# Social Network Project

A Reddit-style social network: communities, posts with media, nested comments,
voting, search, real-time chat, and D3 statistics.

Built as an MVC application:

| Layer          | Location                        | Stack                                  |
| -------------- | ------------------------------- | -------------------------------------- |
| Model          | `server-side/src/Schemas/`      | Mongoose schemas                       |
| Controller     | `server-side/src/Back.js`       | Express 5 REST + `ChatSocket.js` (WS)  |
| View           | `social-network/src/`           | Next.js 16 + React + Tailwind CSS 4    |

---

## 1. Prerequisites

- **Node.js 20 or newer** (the server is started with `node --env-file`, which
  requires Node 20+). Check with `node -v`.
- **A MongoDB connection string** (MongoDB Atlas or a local `mongod`).
- **A Firebase project** with Storage and Authentication enabled (used for
  post media, group icons, and the custom-token auth bridge).

---

## 2. Configuration files (required — not included in the repository)

These three files hold credentials, so they are excluded by `.gitignore` and
**will not be present after cloning**. The project will not start without them.
They are supplied separately with the submission.

**`server-side/.env`**

```
SERVER_PORT=5000
MONGODB_USERNAME=<atlas user>
MONGODB_PASSWORD=<atlas password>
MONGODB_URI=<full mongodb+srv connection string>
JWT_SECRET=<any long random string>
```

**`server-side/social-network-prj-firebase.json`**

The Firebase Admin SDK service-account key, downloaded from
Firebase Console → Project settings → Service accounts → Generate new private key.

**`social-network/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=<...>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<...>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<...>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<...>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<...>
NEXT_PUBLIC_FIREBASE_APP_ID=<...>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<...>
```

Place each file at the exact path shown before continuing.

---

## 3. Running the project

Two terminals are needed — the backend and the frontend run as separate
processes. **Start the backend first.**

### Terminal 1 — backend (port 5000)

```bash
cd server-side
npm install
npm run start
```

Expected output:

```
server running on port:5000
```

### Terminal 2 — frontend (port 3000)

```bash
cd social-network
npm install
npm run build
npm run start
```

Then open **<http://localhost:3000>**.

### Development mode (optional)

For hot-reloading while editing the frontend, replace the build/start pair with:

```bash
cd social-network
npm run dev
```

The backend has no watch mode — restart it manually after changing `Back.js`.

---

## 4. First steps in the app

1. Open <http://localhost:3000> — you are redirected to the login page.
2. Click **Register** and create an account.
3. Create a community from the sidebar, then create a post in it.
4. To try the chat and the private-group behaviour, register a **second user**
   in a different browser (or a private window) and log in as them.

---

## 5. Where to find each required feature

| Requirement                     | Where to see it                                                     |
| ------------------------------- | ------------------------------------------------------------------- |
| CRUD models (3+)                | Users, Groups, Posts, Comments, Conversations, Messages             |
| Parametric search (2+)          | `/search` — keyword, author, and community filters                  |
| Permissions                     | Group admin panel: approve/reject joins, kick members, delete group |
| Private content                 | Private groups hide posts from non-members, in feed and in search   |
| Feed                            | Home page, paginated and interleaved                                |
| Real-time chat (Socket.io)      | `/chat` — direct and group chats, presence dots, typing indicator   |
| Statistics with D3              | Contribution heatmap on `/account`; posts-per-week on any group page|
| Video and Canvas                | Video posts; canvas image resizing on upload                        |
| CSS3 abilities                  | text-shadow, transition, multiple-columns, font-face, border-radius |
| Validation (client + server)    | Registration and account editing validate on both sides             |

---

## 6. Troubleshooting

**`Error: listen EADDRINUSE: address already in use :::5000`**
A backend instance is already running. Close the other terminal, or change
`SERVER_PORT` in `server-side/.env` and update `NEXT_PUBLIC_API_URL` in
`social-network/.env.local` to match.

**`Cannot find module '../social-network-prj-firebase.json'`**
The Firebase service-account file is missing from `server-side/`. See section 2.

**Requests fail with a network error, or the page loads but stays empty**
The backend is not running, or `NEXT_PUBLIC_API_URL` does not match
`SERVER_PORT`. Start the backend first and confirm both ports agree.

**Changes to `.env.local` seem to have no effect**
Next.js reads environment variables at build time. Re-run
`npm run build && npm run start`.

**`npm install` fails while building `bcrypt`**
`bcrypt` is a native module and needs build scripts to run. If your npm
configuration blocks them, allow scripts for `bcrypt` and reinstall.

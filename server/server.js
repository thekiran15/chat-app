import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();

// ================= CREATE HTTP SERVER =================
const server = http.createServer(app);

// ================= SOCKET.IO SETUP =================
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ================= STORE ONLINE USERS =================
export const userSocketMap = {};

// ================= SOCKET CONNECTION =================
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ================= MIDDLEWARE =================
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/api/status", (req, res) => {
  res.send("Server is live ✅");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});

// ================= CONNECT DATABASE (ONCE) =================
connectDB().catch((err) => {
  console.error("Database Connection Failed:", err.message);
  process.exit(1);
});

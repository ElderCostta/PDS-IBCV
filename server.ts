import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Real-time communication logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Join a room based on a presentation ID if we wanted to support multiple presentations
    // For now, let's keep it simple with one global or session-based room
    socket.on("join-presentation", (presentationId) => {
      socket.join(presentationId);
      console.log(`Socket ${socket.id} joined presentation ${presentationId}`);
    });

    socket.on("slide-action", (data) => {
      // Broadcast slide actions (next, prev) to everyone in the room except sender
      socket.to(data.presentationId).emit("slide-action", data);
    });

    socket.on("laser-move", (data) => {
      // Broadcast laser position
      socket.to(data.presentationId).emit("laser-move", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import { Server, Socket } from "socket.io";
import { createServer } from "http";
import pool, { initDb } from "./lib/db";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",  //fn cors toeverything later will change to url and admin also maybe
    methods: ["GET", "POST"],
  },
});

const rooms = new Map<string, Map<string, string>>();

io.on("connection", (socket) => {  //on each connection with the client 
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", async ({ roomCode, username }) => {  //each user will already be a room , if wanna join a room we will use the room code
    socket.join(roomCode); //to join that particular room 

    if (!rooms.has(roomCode)) { //if the room does not exist we will create a new room with the room code and set it to a new map
      rooms.set(roomCode, new Map());
    }
    rooms.get(roomCode)!.set(socket.id, username); //we are setting the username and id to the map if it didnt exist before

    const result = await pool.query( //we are selecting the message of that roomcode specifically the latest one(room code) annd sending to client for display
      "SELECT id, username, text, created_at FROM messages WHERE room_code = $1 ORDER BY created_at DESC LIMIT 50",
      [roomCode]
    );
    const history = result.rows.reverse().map((row) => ({ //we are reversing the order of message for history 
      id: row.id,
      username: row.username,
      text: row.text,
      timestamp: new Date(row.created_at).getTime(),
    }));
    socket.emit("message-history", history); //firing the history and returning the history to the client

    socket.to(roomCode).emit("user-joined", { username, socketId: socket.id }); // a initial message on the room for the onces who joined

    const users = Array.from(rooms.get(roomCode)!.values()); //the users from the room is fetched 
    io.to(roomCode).emit("room-users", users);

    console.log(`${username} joined room ${roomCode}`);
  });

  socket.on("chat-message", async ({ roomCode, username, text }) => {  //adding the text to the db and then sending the message to the room for display
    const result = await pool.query(
      "INSERT INTO messages (room_code, username, text) VALUES ($1, $2, $3) RETURNING id",
      [roomCode, username, text]
    );
    const messageId = result.rows[0].id;

    io.to(roomCode).emit("chat-message", {
      id: messageId,
      username,
      text,
      timestamp: Date.now(),
    });
  });

  socket.on("load-more", async ({ roomCode, beforeId }) => {  //to load more messages namely in for history of the chats
    const result = await pool.query(
      "SELECT id, username, text, created_at FROM messages WHERE room_code = $1 AND id < $2 ORDER BY created_at DESC LIMIT 50",
      [roomCode, beforeId]
    );
    const older = result.rows.reverse().map((row) => ({  //fetching the older onces 
      id: row.id,
      username: row.username,
      text: row.text,
      timestamp: new Date(row.created_at).getTime(),
    }));
    socket.emit("older-messages", older); //sending the client
  });

  socket.on("leave-room", ({ roomCode }) => {
    handleLeave(socket, roomCode);
  });

  socket.on("disconnecting", () => { //when the user is disconnecting we will check if the user is in any room and then we will remove the user from that room
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        handleLeave(socket, room);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

function handleLeave(socket: Socket, roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const username = room.get(socket.id);
  room.delete(socket.id); //when leave is triggered we will remove that user from the room

  if (room.size === 0) {
    rooms.delete(roomCode);  //if empty room
  } else {
    const users = Array.from(room.values()); 
    io.to(roomCode).emit("room-users", users); //else display names of those who are there
  }

  socket.to(roomCode).emit("user-left", { username, socketId: socket.id });
  socket.leave(roomCode);

  if (username) console.log(`${username} left room ${roomCode}`);
}

const PORT = process.env.PORT || 3001;
initDb()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Socket.io server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

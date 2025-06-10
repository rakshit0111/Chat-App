import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
    },
});

// Store online users' socket IDs
const userSocketMap = {};

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;

    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Emit a list of userIds

    // Join a group chat room
    socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
        console.log(`User ${userId} joined group ${groupId}`);
    });

    // Leave a group chat room
    socket.on("leaveGroup", (groupId) => {
        socket.leave(groupId);
        console.log(`User ${userId} left group ${groupId}`);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };
function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join private room
        socket.on("joinRoom", (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Handle sending messages
        socket.on("sendMessage", (data) => {
            const { roomId, message } = data;

            // Broadcast message to other user in room
            io.to(roomId).emit("receiveMessage", message);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
}

module.exports = setupSocket;

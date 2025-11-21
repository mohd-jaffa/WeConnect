const Message = require("../models/message-model");
const User = require("../models/user-model");

const chatController = {};

// --------------------------------------------------
//  GET CHAT HISTORY BETWEEN STUDENT AND TEACHER
// --------------------------------------------------
chatController.getChatHistory = async (req, res) => {
    try {
        const { studentId, teacherId } = req.params;

        const roomId = [studentId, teacherId].sort().join("_");

        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.log(err);
        res.status(500).json("Something went wrong");
    }
};

// --------------------------------------------------
//  SAVE CHAT MESSAGE
// --------------------------------------------------
chatController.saveChat = async (req, res) => {
    try {
        const msg = await Message.create(req.body);

        io.to(msg.roomId).emit("newMessage", {
            _id: msg._id,
            text: msg.text,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            roomId: msg.roomId,
            createdAt: msg.createdAt,
        });

        res.json({ success: true, msg });
    } catch (err) {
        console.log(err);
        res.status(500).json("Cannot save message");
    }
};

// --------------------------------------------------
//  INBOX LIST FOR USER (STUDENT or TEACHER)
// --------------------------------------------------
chatController.getInbox = async (req, res) => {
    try {
        const userId = req.params.id;

        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
        })
            .sort({ createdAt: -1 })
            .lean();

        if (!messages.length) return res.json([]);

        const convoMap = {};

        messages.forEach((msg) => {
            if (!convoMap[msg.roomId]) {
                convoMap[msg.roomId] = {
                    _id: msg.roomId,
                    participants: [
                        msg.senderId.toString(),
                        msg.receiverId.toString(),
                    ],
                    lastMessage: msg.text,
                    lastMessageTime: msg.createdAt,
                    unreadCount:
                        msg.receiverId.toString() === userId &&
                        msg.read === false
                            ? 1
                            : 0,
                };
            }
        });

        const inbox = await Promise.all(
            Object.values(convoMap).map(async (chat) => {
                const otherId = chat.participants.find((id) => id !== userId);
                const otherUser = await User.findById(otherId).select(
                    "name avatar"
                );
                return { ...chat, otherUser };
            })
        );

        res.json(inbox);
    } catch (err) {
        console.log(err);
        res.status(500).json("Something went wrong");
    }
};

module.exports = chatController;

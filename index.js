const express = require("express");
const configureDB = require("./config/db");
const usersController = require("./app/controllers/users-controller");
const authenticateUser = require("./app/middlewares/authenticateUser");
const teachersController = require("./app/controllers/teachers-controller");
const bookingsController = require("./app/controllers/bookings-controller");
require("dotenv").config();
require("./app/cron/booking-status-cron");

const http = require("http");
const { Server } = require("socket.io");
const setupSocket = require("./socket/socket");

const port = process.env.PORT;
const app = express();
const cors = require("cors");
const adminsController = require("./app/controllers/admins-controller");
const uploadMiddleware = require("./app/middlewares/fileUploadMiddleware");
const imageUpload = require("./app/controllers/upload-controllers");
const paymentController = require("./app/controllers/payment-controller");
const assignmentController = require("./app/controllers/assignment-controller");
const chatController = require("./app/controllers/chat-controller");
const authorizeUser = require("./app/middlewares/authorizeUser");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
configureDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

setupSocket(io);

// Auth routes
app.post("/api/register", usersController.register);
app.post("/api/login", usersController.login);

// General public routes
app.get("/api/teachers", usersController.listTeachers);
app.get("/api/sessions", usersController.listSessions);
app.post("/api/search", usersController.search);

// Authenticated user profile
app.get(
    "/api/users/profile",
    authenticateUser,
    authorizeUser(["admin", "teacher", "student"]),
    usersController.profile
);
app.put(
    "/api/users/profile",
    authenticateUser,
    authorizeUser(["admin", "teacher", "student"]),
    usersController.updateProfile
);
app.put(
    "/api/users/password",
    authorizeUser(["admin", "teacher", "student"]),
    authenticateUser,
    usersController.changePassword
);

// Teacher session routes — specific routes BEFORE parameterized
app.get(
    "/api/teachers/sessions",
    authorizeUser(["teacher"]),
    authenticateUser,
    teachersController.listSessions
);
app.post(
    "/api/teachers/sessions",
    authenticateUser,
    authorizeUser(["teacher"]),
    teachersController.createSession
);
app.get(
    "/api/teachers/sessions/:id",
    authenticateUser,
    authorizeUser(["teacher"]),
    teachersController.viewSession
);
app.put(
    "/api/teachers/sessions/:id",
    authenticateUser,
    authorizeUser(["teacher"]),
    teachersController.updateSession
);
app.delete(
    "/api/teachers/sessions/:id",
    authenticateUser,
    authorizeUser(["teacher"]),
    teachersController.removeSession
);
app.get(
    "/api/teachers/students",
    authenticateUser,
    authorizeUser(["teacher"]),
    teachersController.listAllMyStudents
);
app.get(
    "/api/teachers/students/:id",
    authenticateUser,
    authorizeUser(["teacher", "admin"]),
    teachersController.viewStudentAllDetails
);

// Booking routes
app.get(
    "/api/bookings",
    authenticateUser,
    authorizeUser(["student"]),
    bookingsController.viewAllMyBookings
);
app.get(
    "/api/bookings/:id",
    authenticateUser,
    authorizeUser(["student"]),
    bookingsController.viewBooking
);
app.post(
    "/api/bookings",
    authenticateUser,
    authorizeUser(["student"]),
    bookingsController.bookNewSlot
);
app.put(
    "/api/bookings/:id",
    authenticateUser,
    authorizeUser(["student"]),
    bookingsController.cancelBooking
);
app.post(
    "/api/bookings/lock",
    authenticateUser,
    authorizeUser(["student"]),
    bookingsController.checkLock
);
app.post(
    "/api/slots/:id",
    authenticateUser,
    authorizeUser(["student"]),
    bookingsController.getSlots
);

app.get(
    "/api/admin/users",
    authenticateUser,
    authorizeUser(["admin"]),
    adminsController.listAllUsers
);
app.get(
    "/api/admin/bookings",
    authenticateUser,
    authorizeUser(["admin"]),
    adminsController.viewAllBookings
);
app.get(
    "/api/admin/sessions",
    authenticateUser,
    authorizeUser(["admin"]),
    adminsController.viewAllSessions
);

// Dynamic routes — placed LAST to avoid conflict
app.get("/api/teachers/:id", usersController.viewTeacher);
app.get("/api/students/:id", usersController.viewStudent);
app.get("/api/sessions/:id", usersController.viewSession);
app.get(
    "/api/teachers/:id/sessions/",
    teachersController.listTeachersAllSessions
);

app.post(
    "/api/avatar",
    authenticateUser,
    authorizeUser(["admin", "teacher", "student"]),
    uploadMiddleware,
    imageUpload.avatar
);
app.post(
    "/api/thumbnail",
    authenticateUser,
    authorizeUser(["teacher"]),
    uploadMiddleware,
    imageUpload.thumbail
);

app.post(
    "/api/payment/create",
    authenticateUser,
    authorizeUser(["student"]),
    paymentController.createOrder
);
app.post(
    "/api/payment/verify",
    authenticateUser,
    authorizeUser(["student"]),
    paymentController.verifyPayment
);
app.post(
    "/api/payment/cancel",
    authenticateUser,
    authorizeUser(["student"]),
    paymentController.cancelPayment
);
app.post(
    "/api/payment/history",
    authenticateUser,
    authorizeUser(["student"]),
    paymentController.addHistory
);
app.get(
    "/api/payment/history/:id",
    authenticateUser,
    authorizeUser(["student", "teacher", "admin"]),
    paymentController.getHistory
);

app.post(
    "/api/assignment/generate",
    authenticateUser,
    authorizeUser(["teacher"]),
    assignmentController.generateAssignment
);
app.get(
    "/api/assignment/:id",
    authenticateUser,
    authorizeUser(["student", "teacher"]),
    assignmentController.getAssignment
);
app.post(
    "/api/assignment/submit",
    authenticateUser,
    authorizeUser(["student"]),
    assignmentController.submitAnswers
);
app.get(
    "/api/assignment/",
    authenticateUser,
    authorizeUser(["student", "teacher"]),
    assignmentController.getAllAssignments
);

app.get("/api/chat/inbox/:id", chatController.getInbox);
app.get("/api/chat/:studentId/:teacherId", chatController.getChatHistory);
app.post("/api/chat/save", chatController.saveChat);

server.listen(port, () => {
    console.log("server running on port", port);
});

const express = require("express");
const configureDB = require("./config/db");
const usersController = require("./app/controllers/users-controller");
const authenticateUser = require("./app/middlewares/authenticateUser");
const teachersController = require("./app/controllers/teachers-controller");
const bookingsController = require("./app/controllers/bookings-controller");
require("dotenv").config();
require("./app/cron/booking-status-cron");

const port = process.env.PORT;
const app = express();
const cors = require("cors");
const adminsController = require("./app/controllers/admins-controller");
const uploadMiddleware = require("./app/middlewares/fileUploadMiddleware");
const imageUpload = require("./app/controllers/upload-controllers");
const paymentController = require("./app/controllers/payment-controller");
const assignmentController = require("./app/controllers/assignment-controller");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
configureDB();

// Auth routes
app.post("/api/register", usersController.register);
app.post("/api/login", usersController.login);

// General public routes
app.get("/api/teachers", usersController.listTeachers);
app.get("/api/sessions", usersController.listSessions);
app.post("/api/search", usersController.search);

// Authenticated user profile
app.get("/api/users/profile", authenticateUser, usersController.profile);
app.put("/api/users/profile", authenticateUser, usersController.updateProfile);
app.put(
    "/api/users/password",
    authenticateUser,
    usersController.changePassword
);

// Teacher session routes — specific routes BEFORE parameterized
app.get(
    "/api/teachers/sessions",
    authenticateUser,
    teachersController.listSessions
);
app.post(
    "/api/teachers/sessions",
    authenticateUser,
    teachersController.createSession
);
app.get(
    "/api/teachers/sessions/:id",
    authenticateUser,
    teachersController.viewSession
);
app.put(
    "/api/teachers/sessions/:id",
    authenticateUser,
    teachersController.updateSession
);
app.delete(
    "/api/teachers/sessions/:id",
    authenticateUser,
    teachersController.removeSession
);
app.get(
    "/api/teachers/students",
    authenticateUser,
    teachersController.listAllMyStudents
);
app.get(
    "/api/teachers/students/:id",
    authenticateUser,
    teachersController.viewStudentAllDetails
);

// Booking routes
app.get(
    "/api/bookings",
    authenticateUser,
    bookingsController.viewAllMyBookings
);
app.get("/api/bookings/:id", authenticateUser, bookingsController.viewBooking);
app.post("/api/bookings", authenticateUser, bookingsController.bookNewSlot);
app.put(
    "/api/bookings/:id",
    authenticateUser,
    bookingsController.cancelBooking
);
app.post("/api/bookings/lock", authenticateUser, bookingsController.checkLock);
app.post("/api/slots/:id", authenticateUser, bookingsController.getSlots);

app.get("/api/admin/users", authenticateUser, adminsController.listAllUsers);
app.get(
    "/api/admin/bookings",
    authenticateUser,
    adminsController.viewAllBookings
);
app.get(
    "/api/admin/sessions",
    authenticateUser,
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

app.post("/api/avatar", authenticateUser, uploadMiddleware, imageUpload.avatar);
app.post(
    "/api/thumbnail",
    authenticateUser,
    uploadMiddleware,
    imageUpload.thumbail
);

app.post(
    "/api/payment/create",

    paymentController.createOrder
);
app.post(
    "/api/payment/verify",

    paymentController.verifyPayment
);
app.post(
    "/api/payment/cancel",
    authenticateUser,
    paymentController.cancelPayment
);
app.post(
    "/api/payment/history",
    authenticateUser,
    paymentController.addHistory
);
app.get(
    "/api/payment/history/:id",
    authenticateUser,
    paymentController.getHistory
);

app.post(
    "/api/assignment/generate",
    authenticateUser,
    assignmentController.generateAssignment
);
app.get(
    "/api/assignment/:id",
    authenticateUser,
    assignmentController.getAssignment
);
app.post(
    "/api/assignment/submit",
    authenticateUser,
    assignmentController.submitAnswers
);
app.get(
    "/api/assignment/",
    authenticateUser,
    assignmentController.getAllAssignments
);

app.listen(port, () => {
    console.log("server running on port", port);
});

const express = require("express");
const configureDB = require("./config/db");
const usersController = require("./app/controllers/users-controller");
const authenticateUser = require("./app/middlewares/authenticateUser");
const teachersController = require("./app/controllers/teachers-controller");
const bookingsController = require("./app/controllers/bookings-controller");
require("dotenv").config();
require('./app/cron/booking-status-cron');

const port = process.env.PORT;
const app = express();

app.use(express.json());
configureDB();

// Auth routes
app.post("/api/register", usersController.register);
app.post("/api/login", usersController.login);

// General public routes
app.get("/api/teachers", usersController.listTeachers);
app.get("/api/sessions", usersController.listSessions);
app.get("/api/search", usersController.search);

// Authenticated user profile
app.get("/api/users/profile", authenticateUser, usersController.profile);
app.put("/api/users/profile", authenticateUser, usersController.updateProfile);

// Teacher session routes — specific routes BEFORE parameterized
app.get("/api/teachers/sessions", authenticateUser, teachersController.listSessions);
app.post("/api/teachers/sessions", authenticateUser, teachersController.createSession);
app.get("/api/teachers/sessions/:id", authenticateUser, teachersController.viewSession);
app.put("/api/teachers/sessions/:id", authenticateUser, teachersController.updateSession);
app.delete("/api/teachers/sessions/:id", authenticateUser, teachersController.removeSession);

// Booking routes
app.get("/api/bookings", authenticateUser, bookingsController.viewAllMyBookings);
app.get("/api/bookings/:id", authenticateUser, bookingsController.viewBooking);
app.post("/api/bookings", authenticateUser, bookingsController.bookNewSlot);

// Dynamic routes — placed LAST to avoid conflict
app.get("/api/teachers/:id", usersController.viewTeacher);
app.get("/api/sessions/:id", usersController.viewSession);



app.listen(port, () => {
    console.log("server running on port", port);
});

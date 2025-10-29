const mongoose = require("mongoose");
const User = require("../models/user-model");
const Session = require("../models/session-model");
const Booking = require("../models/booking-model");

const adminsController = {};

//! <-------------------- LIST ALL USERS --------------------> !\\

adminsController.listAllUsers = async (req, res) => {
    try {
        const user = await User.find({ role: { $in: ["teacher", "student"] } });
        if (user.length === 0) {
            return res.status(404).json({ error: "users not found" });
        }
        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- DELETE A USER --------------------> !\\

adminsController.deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await User.findbyAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: "user not found!" });
        }
        res.status(200).json({ message: "User deleted successfully", user });
    } catch (err) {
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW ALL SESSIONS --------------------> !\\

adminsController.viewAllSessions = async (req, res) => {
    try {
        const session = await Session.find();
        if (session.length === 0) {
            return res.status(404).json({ error: "sessions not found" });
        }
        res.status(200).json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

adminsController.viewAllBookings = async (req, res) => {
    try {
        const booking = await Booking.find()
            .populate("teachersId")
            .populate("studentsId")
            .populate("details");
        if (booking.length === 0) {
            return res.status(404).json({ error: "sessions not found" });
        }
        res.status(200).json(booking);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

module.exports = adminsController;

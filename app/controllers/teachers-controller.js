const Booking = require("../models/booking-model");
const Session = require("../models/session-model");
const {
    addSessionValidationSchema,
    updateSessionValidationSchema,
} = require("../validations/teacher-validation");
const mongoose = require("mongoose");
const User = require("../models/user-model");
const Assignment = require("../models/assignment-model");

const teachersController = {};

//! <-------------------- LIST SESSIONS --------------------> !\\

teachersController.listSessions = async (req, res) => {
    try {
        const session = await Session.find({ teachersId: req.userId });
        res.json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- CREATE SESSION --------------------> !\\

teachersController.createSession = async (req, res) => {
    const body = req.body;
    const { error, value } = addSessionValidationSchema.validate(body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(400).json({ error: error.details });
    }
    if (
        value.slots.isrecurring == false &&
        (value.slots.startDate < Date.now() ||
            value.slots.endDate < value.slots.startDate)
    ) {
        return res.status(400).json({ error: "invalid Date / Time" });
    }
    try {
        const session = new Session(value);
        session.teachersId = req.userId;
        await session.save();
        res.json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW A SESSION --------------------> !\\

teachersController.viewSession = async (req, res) => {
    const id = req.params.id;
    try {
        const session = await Session.findOne({
            _id: id,
            teachersId: req.userId,
        });
        if (!session) {
            return res.status(404).json({ error: "session not found!" });
        }
        res.status(201).json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- UPDATE SESSIONS --------------------> !\\

teachersController.updateSession = async (req, res) => {
    const body = req.body;
    const id = req.params.id;
    const { error, value } = updateSessionValidationSchema.validate(body, {
        abortEarly: false,
    });
    console.log(body);
    if (error) {
        return res.status(400).json({ error: error.details });
    }
    try {
        if (value == undefined) {
            return res.json(
                await Session.findOne({ _id: id, teachersId: req.userId })
            );
        }
        const session = await Session.findOneAndUpdate(
            { _id: id, teachersId: req.userId },
            { $set: value },
            { new: true, runValidators: true }
        );
        if (!session) {
            return res.status(404).json({ error: "session not found!" });
        }
        res.status(201).json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- DELETE A SESSION --------------------> !\\

teachersController.removeSession = async (req, res) => {
    const id = req.params.id;
    try {
        const session = await Session.findOneAndDelete({
            _id: id,
            teachersId: req.userId,
        });
        if (!session) {
            return res.status(404).json({ error: "session not found!" });
        }
        res.status(201).json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- LIST A TEACHERS ALL SESSIONS --------------------> !\\

teachersController.listTeachersAllSessions = async (req, res) => {
    const id = req.params.id;
    try {
        const session = await Session.find({ teachersId: id });
        res.json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- LIST ALL STUDENTS OF A TEACHER --------------------> !\\

teachersController.listAllMyStudents = async (req, res) => {
    const id = new mongoose.Types.ObjectId(req.userId);
    try {
        const result = await Booking.aggregate([
            { $match: { teachersId: id } },
            { $group: { _id: "$studentsId" } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo",
                },
            },
            { $unwind: "$studentInfo" },
            {
                $project: {
                    _id: "$studentInfo._id",
                    name: "$studentInfo.name",
                    email: "$studentInfo.email",
                    avatar: "$studentInfo.avatar",
                    bio: "$studentInfo.bio",
                },
            },
        ]);
        if (!result.length) {
            return res.status(404).json("No students found for this teacher.");
        }
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW MY STUDENTS DETAILS --------------------> !\\

teachersController.viewStudentAllDetails = async (req, res) => {
    const studentId = req.params.id;
    const teacherId = req.userId;

    try {
        const student = await User.findById(studentId).select("-passwordHash");
        if (!student) {
            return res.status(404).json({ message: "Student not found!" });
        }
        const bookings = await Booking.find({
            teachersId: teacherId,
            studentsId: studentId,
        })
            .populate("details")
            .sort({ "time.start": -1 });
        const assignments = await Assignment.find({
            teacherId: teacherId,
            studentId: studentId,
        }).sort({ createdAt: -1 });
        res.json({
            student,
            bookings,
            assignments,
        });
    } catch (err) {
        console.error("Error in viewStudentAllDetails:", err);
        res.status(500).json({ error: "Something went wrong!" });
    }
};

module.exports = teachersController;

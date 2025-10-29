const Booking = require("../models/booking-model");
const Session = require("../models/session-model");
const {
    addSessionValidationSchema,
    updateSessionValidationSchema,
} = require("../validations/teacher-validation");

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

//! <-------------------- LIST MY BOOKINGS --------------------> !\\

// teachersController.viewMyBookings = async (req, res) => {
//     try {
//         const booking = await Booking.find({ teachersId: req.userId });
//         if (booking.length === 0) {
//             return res.status(404).json({ error: "bookings not found!" });
//         }
//         res.json(booking);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: "something went wrong!!!" });
//     }
// };

module.exports = teachersController;

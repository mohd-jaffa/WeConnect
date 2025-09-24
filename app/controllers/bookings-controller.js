const dayjs = require("../utils/dayjs-setup");
const Booking = require("../models/booking-model");
const Session = require("../models/session-model");
const bookingsValidationSchema = require("../validations/booking-validation");

const bookingsController = {};

//! <-------------------- BOOK A SLOT --------------------> !\\

bookingsController.bookNewSlot = async (req, res) => {
    const body = req.body;
    const { error, value } = bookingsValidationSchema.validate(body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(400).json({ error: error.details });
    }
    const sessionId = value.details;
    const bookingStart = value.time.start;
    const bookingEnd = value.time.end;
    const bookingDate = new Date(bookingStart);
    const bookingDay = bookingDate
        .toLocaleString("en-US", { weekday: "short" })
        .toLowerCase();
    const bookingStartTime = bookingStart.split("T")[1].slice(0, 5);
    const bookingEndTime = bookingEnd.split("T")[1].slice(0, 5);
    try {
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: "session not found!" });
        }
        const isValidSlot = session.slots.some((ele) => {
            if (ele.isRecurring) {
                if (!ele.daysOfWeek.includes(bookingDay)) return false;
                return (
                    bookingStartTime >= ele.startTime &&
                    bookingEndTime <= ele.endTime
                );
            } else {
                return (
                    bookingStart >= ele.startDate && bookingEnd <= ele.endDate
                );
            }
        });
        if (!isValidSlot) {
            return res.status(400).json({
                error: "selected time is not within the available slot timings!",
            });
        }
        const isOverlapping = await Booking.findOne({
            teachersId: session.teachersId,
            status: { $in: ["upcoming", "ongoing"] },
            "time.start": { $lt: bookingEnd },
            "time.end": { $gt: bookingStart },
        });
        if (isOverlapping) {
            return res.status(400).json({ error: "time slot already booked" });
        }
        const booking = new Booking({
            ...value,
            studentsId: req.userId,
            teachersId: session.teachersId,
        });
        await booking.save();
        res.status(201).json(booking);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW ALL MY BOOKINGS --------------------> !\\

bookingsController.viewAllMyBookings = async (req, res) => {
    const id = req.userId;
    try {
        const booking = await Booking.find({
            $or: [{ teachersId: id }, { studentsId: id }],
        });
        if (!booking) {
            return res.status(404).json({ error: "bookings not found!" });
        }
        res.json(booking);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW A BOOKING --------------------> !\\

bookingsController.viewBooking = async (req, res) => {
    const id = req.params.id;
    try {
        const booking = await Booking.findOne({
            _id: id,
            $or: [{ teachersId: id }, { studentsId: id }],
        });
        if (!booking) {
            return res.status(404).json({ error: "bookings not found!" });
        }
        res.json(booking);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- CANCEL A BOOKING --------------------> !\\

bookingsController.cancelBooking = async (req, res) => {
    const id = req.params.id;
    const userId = req.userId;
    try {
        const booking = await Booking.findOneAndUpdate(
            { _id: id, $or: [{ teachersId: userId }, { studentsId: userId }] },
            { $set: { status: "cancelled" } },
            { new: true }
        );
        if (!booking) {
            return res.status(404).json({ error: "booking not found!" });
        }
        res.json(booking);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

module.exports = bookingsController;

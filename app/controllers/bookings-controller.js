const dayjs = require("../utils/dayjs-setup");
const Booking = require("../models/booking-model");
const Session = require("../models/session-model");
const bookingsValidationSchema = require("../validations/booking-validation");
const Slot = require("../models/slot-model");

const bookingsController = {};

const generateJitsiLink = (teacherId, studentId) => {
    const uniqueId = Date.now();
    return `https://meet.jit.si/${teacherId}-${studentId}-${uniqueId}`;
};

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
        const meetingLink = generateJitsiLink(session.teachersId, req.userId);
        const booking = new Booking({
            ...value,
            studentsId: req.userId,
            teachersId: session.teachersId,
            meetLink: meetingLink,
        });
        await booking.save();
        console.log(booking);
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
        })
            .populate("teachersId")
            .populate("studentsId")
            .populate("details");
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
            { _id: id, $or: [{ teacherId: userId }, { studentId: userId }] },
            { $set: { status: "cancelled" } },
            { new: true }
        ).populate("studentId teacherId details");

        if (!booking) {
            return res.status(404).json({ error: "Booking not found!" });
        }

        res.json({
            message: "Booking cancelled successfully!",
            booking,
        });
    } catch (err) {
        console.error("Cancel booking error:", err);
        res.status(500).json({ error: "Something went wrong!" });
    }
};


//! <-------------------- VIEW FREE SLOTS --------------------> !\\

bookingsController.getSlots = async (req, res) => {
    const sessionId = req.params.id;
    const { date } = req.body;
    // Expecting: date as 'YYYY-MM-DD' and details as sessionId (24-hex)
    const datePattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    const idPattern = /^[a-fA-F0-9]{24}$/;
    if (!date || !datePattern.test(date)) {
        return res.status(400).json({ error: "date must be in YYYY-MM-DD" });
    }
    if (!sessionId || !idPattern.test(sessionId)) {
        return res
            .status(400)
            .json({ error: "details must be a valid session id" });
    }

    try {
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: "session not found!" });
        }

        const dayStart = `${date}T00:00:00`;
        const dayEnd = `${date}T23:59:59`;
        const bookingDate = new Date(`${date}T00:00:00`);
        const bookingDay = bookingDate
            .toLocaleString("en-US", { weekday: "short" })
            .toLowerCase();

        // Build availability windows from session slots for this date
        const availabilityWindows = [];
        (session.slots || []).forEach((slot) => {
            if (slot.isRecurring) {
                if (
                    !Array.isArray(slot.daysOfWeek) ||
                    !slot.daysOfWeek.includes(bookingDay)
                )
                    return;
                if (!slot.startTime || !slot.endTime) return;
                const winStart = `${date}T${slot.startTime}:00`;
                const winEnd = `${date}T${slot.endTime}:00`;
                if (winStart < winEnd) {
                    availabilityWindows.push({ start: winStart, end: winEnd });
                }
            } else {
                // Non-recurring date-time window; intersect with the day range
                if (!slot.startDate || !slot.endDate) return;
                const winStart = dayjs(slot.startDate).isSameOrAfter(dayStart)
                    ? slot.startDate
                    : dayStart;
                const winEnd = dayjs(slot.endDate).isSameOrBefore(dayEnd)
                    ? slot.endDate
                    : dayEnd;
                if (winStart < winEnd && !dayjs(winStart).isAfter(winEnd)) {
                    availabilityWindows.push({ start: winStart, end: winEnd });
                }
            }
        });

        if (availabilityWindows.length === 0) {
            return res.json([]);
        }

        // Fetch existing bookings for this teacher that overlap the day
        const existingBookings = await Booking.find({
            teachersId: session.teachersId,
            status: { $in: ["upcoming", "ongoing"] },
            "time.start": { $lt: dayEnd },
            "time.end": { $gt: dayStart },
        }).lean();

        // Helper to see if a 1h candidate overlaps any booking
        const overlapsAnyBooking = (candStartStr, candEndStr) => {
            for (const b of existingBookings) {
                const bStart = b?.time?.start;
                const bEnd = b?.time?.end;
                if (!bStart || !bEnd) continue;
                if (candStartStr < bEnd && candEndStr > bStart) return true;
            }
            return false;
        };

        // Generate 1-hour slots within each window and filter out overlaps
        const result = [];
        for (const win of availabilityWindows) {
            let cursor = dayjs(win.start);
            const windowEnd = dayjs(win.end);
            while (cursor.add(1, "hour").isSameOrBefore(windowEnd)) {
                const s = cursor.format("YYYY-MM-DDTHH:mm:ss");
                const e = cursor.add(1, "hour").format("YYYY-MM-DDTHH:mm:ss");
                // Ensure the 1h slot fits entirely within the window
                if (e > win.end) break;
                if (!overlapsAnyBooking(s, e)) {
                    result.push({
                        time: { start: s, end: e },
                        sessionId,
                    });
                }
                cursor = cursor.add(1, "hour");
            }
        }

        // Sort by start time for consistency
        result.sort((a, b) =>
            a.time.start < b.time.start
                ? -1
                : a.time.start > b.time.start
                ? 1
                : 0
        );

        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- CHECK LOCK SLOTS --------------------> !\\

bookingsController.checkLock = async (req, res) => {
    const body = req.body;
    const { error, value } = bookingsValidationSchema.validate(body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            error: error.details,
        });
    }
    try {
        const existingSlot = await Slot.findOneAndUpdate(
            { details: value.details, time: value.time },
            {
                $setOnInsert: {
                    ...value,
                    expiresAt: new Date(Date.now() + 6 * 60 * 1000),
                },
            },
            { upsert: true, new: false }
        );
        if (existingSlot) {
            return res.json({
                success: false,
                message:
                    "Someone is trying to book this slot, please check again after 5min or select a different slot.",
            });
        }
        res.json({
            success: true,
            message:
                "Slot locked. Complete the payment to confirm the booking.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = bookingsController;

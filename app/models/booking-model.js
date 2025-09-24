const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
    {
        teachersId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        studentsId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        details: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Session",
        },
        time: {
            start: {
                type: String,
                match: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
            },
            end: {
                type: String,
                match: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
            },
        },
        status: {
            type: String,
            enum: ["upcoming", "ongoing", "completed", "cancelled"],
            required: true,
            default: "upcoming",
        },
    },
    { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;

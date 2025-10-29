const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            min: 5,
            max: 30,
        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        bio: {
            type: String,
        },
        skills: {
            type: [String],
            default: undefined,
        },
        bookings: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Boookings",
        },
        role: {
            type: String,
            enum: ["student", "teacher"],
            required: true,
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        avatar: {
            type: String,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

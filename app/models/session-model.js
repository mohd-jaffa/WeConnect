const mongoose = require("mongoose");

const slotSchema = mongoose.Schema({
    startDate: {
        type: String,
    },
    endDate: {
        type: String,
    },
    startTime: {
        type: String,
    },
    endTime: {
        type: String,
    },
    daysOfWeek: {
        type: [String],
        enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        validate: {
            validator: function (arr) {
                return arr.length < 6 && arr.length > 0;
            },
            message: "At least one day of the week must be selected",
        },
        default: undefined,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
});

const sessionSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            min: 5,
            max: 128,
        },
        description: {
            type: String,
            min: 5,
            max: 1024,
        },
        teachersId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        slots: {
            type: [slotSchema],
            default: undefined,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        amount: Number,
    },
    { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;

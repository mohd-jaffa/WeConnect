const mongoose = require("mongoose");

const slotSchema = mongoose.Schema({
    startDate: {
        type: String,
        match: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
    },
    endDate: {
        type: String,
        match: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
    },
    startTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
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
            max: 512,
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
    },
    { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;

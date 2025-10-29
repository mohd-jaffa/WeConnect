const mongoose = require("mongoose");

const slotSchema = mongoose.Schema(
    {
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
        expiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

slotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Slot = mongoose.model("Slot", slotSchema);
module.exports = Slot;

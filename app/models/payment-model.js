const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
    {
        orderId: String,
        amount: Number,
        status: {
            type: String,
            enum: ["success", "failed"],
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;

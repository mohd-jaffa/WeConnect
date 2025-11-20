const Razorpay = require("razorpay");
const crypto = require("crypto");
const paymentValidationSchema = require("../validations/payment-validation");
const Payment = require("../models/payment-model");
const Session = require("../models/session-model");
require("dotenv").config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentController = {};

paymentController.createOrder = async (req, res) => {
    console.log("Payment creation endpoint hit");
    try {
        const { sessionId } = req.body;
        console.log("Request body:", req.body);
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }
        const amount = session.amount;
        if (!amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (amount <= 0) {
            return res
                .status(400)
                .json({ error: "Amount must be greater than zero" });
        }
        console.log("Creating Razorpay Order...");
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
        console.log("Razorpay Order Response:", order);
        if (!order || !order.id) {
            console.error(
                "Error: Order ID is missing in the Razorpay response"
            );
            return res.status(500).json({
                error: "Failed to create Razorpay order. Order ID is missing",
            });
        }
        console.log("Order ID:", order.id);
        res.json({
            orderId: order.id,
            key: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
        });
    } catch (err) {
        console.error("Error creating payment:", err);
        res.status(500).json({ error: "Failed to create payment order" });
    }
};

paymentController.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            // details,
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Payment success → mark slot booked
            // await Slot.findByIdAndUpdate(slotId, { isBooked: true });
            res.json({
                success: true,
                message: "Payment verified & slot booked",
            });
        } else {
            // Payment failed → unlock slot
            // await LockedSlot.deleteOne({ slotId });
            res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

paymentController.cancelPayment = async (req, res) => {
    try {
        const { slotId } = req.body;
        await LockedSlot.deleteOne({ slotId });
        res.json({
            success: true,
            message: "Slot unlocked after failed payment",
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

paymentController.addHistory = async (req, res) => {
    const body = req.body;
    try {
        const { error, value } = paymentValidationSchema.validate(body, {
            abortEarly: false,
        });
        if (error) {
            return res.status(400).json({ error: error.details });
        }
        const payment = new Payment(value);
        await payment.save();
        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json(err);
    }
};

paymentController.getHistory = async (req, res) => {
    const id = req.params.id;
    try {
        const history = await Payment.find({ userId: id })
            .populate("sessionId")
            .populate("userId");
        if (history.length === 0) {
            return res.status(404).json({ error: "No payment history found!" });
        }
        res.json(history);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = paymentController;

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
});

const assignmentSchema = new mongoose.Schema(
    {
        instructorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        topic: String,
        questions: [questionSchema],
        studentAnswers: [String],
        marks: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);
module.exports = Assignment;

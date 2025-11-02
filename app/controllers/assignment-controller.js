const Assignment = require("../models/assignment-model");
const mongoose = require("mongoose");
const axios = require("axios");
const OpenAI = require("../../config/openai");

const assignmentController = {};

assignmentController.generateAssignment = async (req, res) => {
    try {
        const { topic, instructorId, studentId, bookingId } = req.body;

        if (!topic || !instructorId || !studentId || !bookingId) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: topic, instructorId, studentId, bookingId",
            });
        }

        // Validate MongoDB ObjectIds
        if (!mongoose.Types.ObjectId.isValid(instructorId)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid instructorId" });
        }
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid studentId" });
        }
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid bookingId" });
        }

        const prompt = `Create 10 multiple choice questions with 4 options on topic "${topic}".
Each item must be a JSON object with: question (string), options (array of 4 strings), correctAnswer (string equal to one of the options), explanation (string).
Return ONLY a valid JSON array (no extra text, no code fences) in the form: [{"question":"...","options":["...","...","...","..."],"correctAnswer":"...","explanation":"..."}]`;

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 60000,
            }
        );

        const content = response?.data?.choices?.[0]?.message?.content || "";

        let questions;
        try {
            // First try direct parse
            questions = JSON.parse(content);
        } catch (_) {
            // Fallback: extract JSON array from content (in case model added extra text)
            const startIdx = content.indexOf("[");
            const endIdx = content.lastIndexOf("]");
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                const maybeJson = content.slice(startIdx, endIdx + 1);
                try {
                    questions = JSON.parse(maybeJson);
                } catch (parseErr) {
                    return res.status(502).json({
                        success: false,
                        message: "AI response could not be parsed as JSON",
                        details: parseErr?.message,
                    });
                }
            } else {
                return res.status(502).json({
                    success: false,
                    message: "AI response did not contain a JSON array",
                });
            }
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(502).json({
                success: false,
                message: "AI returned no questions",
            });
        }

        const assignment = await Assignment.create({
            instructorId,
            studentId,
            bookingId,
            topic,
            questions,
        });

        res.json({ success: true, assignment });
    } catch (error) {
        const details = error?.response?.data || error?.message;
        console.error("generateAssignment error:", details);
        // Provide clearer error when model is not found or not accessible
        if (details?.error?.code === "model_not_found") {
            return res.status(502).json({
                success: false,
                message:
                    "OpenAI model not available. Set OPENAI_MODEL to a valid model.",
                details,
            });
        }
        res.status(500).json({
            success: false,
            message: "Error generating assignment",
            details,
        });
    }
};

assignmentController.getAssignment = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res
                .status(400)
                .json({ success: false, message: "assignmentId is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid assignmentId" });
        }
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res
                .status(404)
                .json({ success: false, message: "Assignment not found" });
        }
        res.json(assignment);
    } catch (error) {
        console.error("getAssignment error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching assignment",
        });
    }
};

assignmentController.submitAnswers = async (req, res) => {
    try {
        const { id, answers } = req.body;
        if (!id || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "assignmentId and answers array are required",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid assignmentId" });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res
                .status(404)
                .json({ success: false, message: "Assignment not found" });
        }

        let marks = 0;
        assignment.questions.forEach((q, i) => {
            if (answers[i] === q.correctAnswer) marks++;
        });

        assignment.studentAnswers = answers;
        assignment.marks = marks;
        assignment.isCompleted = true;
        await assignment.save();
        res.json({ success: true, marks, total: assignment.questions.length });
    } catch (error) {
        console.error("submitAnswers error:", error);
        res.status(500).json({
            success: false,
            message: "Error submitting answers",
        });
    }
};

assignmentController.getAllAssignments = async (req, res) => {
    const id = req.userId;
    try {
        const assignment = await Assignment.find({ studentId: id });
        if (assignment.length === 0) {
            return res.json({ message: "no records found" });
        }
        res.status(200).json(assignment);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong" });
    }
};

module.exports = assignmentController;

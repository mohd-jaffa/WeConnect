const User = require("../models/user-model");
const jwt = require("jsonwebtoken");
const bcrypts = require("bcryptjs");
const {
    userLoginValidationSchema,
    teacherRegisterValidationSchema,
    studentRegisterValidationSchema,
    updateProfileSchema,
} = require("../validations/user-validation");
const Session = require("../models/session-model");

const usersController = {};

//! <-------------------- REGISTER --------------------> !\\

usersController.register = async (req, res) => {
    const body =
        req.body.role === "teacher"
            ? { ...req.body, isApproved: false }
            : req.body;
    let validationType;
    if (body.role == "teacher") {
        validationType = teacherRegisterValidationSchema;
    } else {
        validationType = studentRegisterValidationSchema;
    }
    const { error, value } = validationType.validate(body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(400).json({ error: error.details });
    }
    const userByEmail = await User.findOne({ email: value.email });
    if (userByEmail) {
        return res.status(400).json({ error: "Email already taken" });
    }
    try {
        const user = new User(value);
        const salt = await bcrypts.genSalt();
        const hash = await bcrypts.hash(value.password, salt);
        user.passwordHash = hash;
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something Went wrong!!!" });
    }
};

//! <-------------------- LOGIN --------------------> !\\

usersController.login = async (req, res) => {
    const body = req.body;
    const { error, value } = userLoginValidationSchema.validate(body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(400).json({ error: error.details });
    }
    try {
        const user = await User.findOne({ email: value.email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email / password" });
        }
        const passwordMatch = await bcrypts.compare(
            value.password,
            user.passwordHash
        );
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email / password" });
        }
        const tokenData = { userId: user._id, role: user.role };
        const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        res.status(201).json({ token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW PROFILE --------------------> !\\

usersController.profile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- UPDATE PROFILE --------------------> !\\

usersController.updateProfile = async (req, res) => {
    const body = req.body;
    const id = req.userId;

    Object.keys(body).forEach((key) => body[key] === "" && delete body[key]);

    const { error, value } = updateProfileSchema.validate(body, {
        abortEarly: false,
        allowUnknown: true,
    });
    if (error) {
        return res.status(400).json({ error: error.details });
    }
    try {
        if (!value || Object.keys(value).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }
        const user = await User.findByIdAndUpdate(
            id,
            { $set: value },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong" });
    }
};

//! <-------------------- LIST ALL TEACHERS --------------------> !\\

usersController.listTeachers = async (req, res) => {
    try {
        const user = await User.find({ role: "teacher" });
        if (!user) {
            return res.status(404).json({ error: "no teachers found!" });
        }
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- LIST ALL SESSIONS --------------------> !\\

usersController.listSessions = async (req, res) => {
    try {
        const session = await Session.find().populate("teachersId");
        if (!session) {
            return res.status(404).json({ error: "no sessions found!" });
        }
        res.status(201).json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- SEARCH QUERY --------------------> !\\

// usersController.search = async (req, res) => {
//     const filter = {};
//     const sessionFilter = {};
//     if (req.query.name) filter.name = { $regex: req.query.name, $options: "i" };
//     if (req.query.category)
//         filter.category = { $regex: req.query.category, $options: "i" };
//     if (req.query.skills)
//         filter.skills = { $regex: req.query.skills, $options: "i" };
//     if (req.query.sessions)
//         sessionFilter.title = { $regex: req.query.sessions, $options: "i" };
//     try {
//         const [users, sessions] = await Promise.all([
//             Object.keys(filter).length > 0 ? User.find(filter) : [],
//             Object.keys(sessionFilter).length > 0
//                 ? Session.find(sessionFilter)
//                 : [],
//         ]);
//         return res.json({ users, sessions });
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: "something went wrong!!!" });
//     }
// };

usersController.search = async (req, res) => {
    try {
        const { keyword } = req.body;

        if (!keyword || keyword.trim() === "") {
            return res.status(400).json({ error: "Keyword is required" });
        }

        // Case-insensitive regex pattern
        const regex = new RegExp(keyword.trim(), "i");

        // Search Teachers (role = "teacher") by name or skills
        const userFilter = {
            role: "teacher",
            $or: [{ name: { $regex: regex } }, { skills: { $regex: regex } }],
        };

        // Search Sessions by title or category
        const sessionFilter = {
            $or: [
                { title: { $regex: regex } },
                { category: { $regex: regex } },
            ],
        };

        // Run both in parallel
        const [users, sessions] = await Promise.all([
            User.find(userFilter), // Optional: return only needed fields
            Session.find(sessionFilter).populate("teachersId"),
        ]);

        return res.status(200).json({ users, sessions });
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ error: "Something went wrong!" });
    }
};

//! <-------------------- VIEW A TEACHERS DETAILS --------------------> !\\

usersController.viewTeacher = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await User.findOne({ _id: id });
        if (!user) {
            return res.status(404).json("user not found!");
        }
        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW A STUDENTS DETAILS --------------------> !\\

usersController.viewStudent = async (req, res) => {
    const id = req.params.id;
    try {
        const user = await User.findOne({ _id: id });
        if (!user) {
            return res.status(404).json("user not found!");
        }
        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- VIEW A SESSION DETAILS --------------------> !\\

usersController.viewSession = async (req, res) => {
    const id = req.params.id;
    try {
        const session = await Session.findOne({ _id: id }).populate(
            "teachersId"
        );
        if (!session) {
            return res.status(404).json({ error: "session not found!" });
        }
        res.json(session);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "something went wrong!!!" });
    }
};

//! <-------------------- CHANGE PASSWORD --------------------> !\\

usersController.changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if (newPassword.length < 8) {
            return res
                .status(400)
                .json({ error: "New password must be at least 8 characters" });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const isMatch = await bcrypts.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect old password" });
        }
        const salt = await bcrypts.genSalt();
        const newHash = await bcrypts.hash(newPassword, salt);
        user.passwordHash = newHash;
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

module.exports = usersController;

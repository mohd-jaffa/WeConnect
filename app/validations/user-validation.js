const Joi = require("joi");

const teacherRegisterValidationSchema = Joi.object({
    name: Joi.string().trim().required().min(5).max(30),
    email: Joi.string().email().required().trim(),
    password: Joi.string().trim().required().min(8).max(128),
    category: Joi.string().trim().required(),
    role: Joi.string().trim().required().valid("teacher"),
});

const studentRegisterValidationSchema = Joi.object({
    name: Joi.string().trim().required().min(5).max(30),
    email: Joi.string().email().required().trim(),
    password: Joi.string().required().trim().min(8).max(128),
    role: Joi.string().trim().required().valid("student"),
});

const userLoginValidationSchema = Joi.object({
    email: Joi.string().trim().required().email(),
    password: Joi.string().trim().required().min(8).max(128),
});

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(5).max(30),
    email: Joi.string().email().trim(),
    category: Joi.string().trim(),
    skills: Joi.array().items(Joi.string().min(4).max(32).trim()),
    bio: Joi.string().min(5).max(128).trim(),
});

module.exports = {
    teacherRegisterValidationSchema,
    studentRegisterValidationSchema,
    userLoginValidationSchema,
    updateProfileSchema,
};

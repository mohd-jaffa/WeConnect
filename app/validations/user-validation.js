const Joi = require("joi");

const teacherRegisterValidationSchema = Joi.object({
    name: Joi.string().trim().required().min(5).max(30),
    email: Joi.string().email().required().trim(),
    password: Joi.string().trim().required().min(8).max(128),
    role: Joi.string().trim().required().valid("teacher"),
    isApproved: Joi.boolean().optional(),
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
    name: Joi.string().trim().min(5).max(30).optional(),
    email: Joi.string().email().trim().optional(),
    skills: Joi.array().items(Joi.string().max(32).trim()).optional(),
    bio: Joi.string().min(5).max(128).trim().optional(),
    avatar: Joi.string().uri().optional().trim(),
});

module.exports = {
    teacherRegisterValidationSchema,
    studentRegisterValidationSchema,
    userLoginValidationSchema,
    updateProfileSchema,
};

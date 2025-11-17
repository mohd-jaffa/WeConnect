const Joi = require("joi");

const addSchema = Joi.object({
    isRecurring: Joi.boolean().optional(),

    startDate: Joi.string()
        .pattern(
            /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
        )
        .when("isRecurring", {
            is: Joi.valid(false).required(),
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        }),
    endDate: Joi.string()
        .pattern(
            /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
        )
        .when("isRecurring", {
            is: Joi.valid(false).required(),
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        }),

    startTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .when("isRecurring", {
            is: true,
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        })
        .messages({
            "string.pattern.base": "startTime must be in HH:mm 24-hour format",
        }),

    endTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .when("isRecurring", {
            is: true,
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        })
        .messages({
            "string.pattern.base": "endTime must be in HH:mm 24-hour format",
        }),

    daysOfWeek: Joi.array()
        .items(
            Joi.string().valid("mon", "tue", "wed", "thu", "fri", "sat", "sun")
        )
        .min(1)
        .when("isRecurring", {
            is: true,
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        })
        .messages({
            "any.only":
                "daysOfWeek must be one of mon, tue, wed, thu, fri, sat, sun",
        }),
});

const updateSchema = Joi.object({
    isRecurring: Joi.boolean().optional(),

    startDate: Joi.string().when("isRecurring", {
        is: Joi.valid(false).required(),
        then: Joi.optional(),
        otherwise: Joi.forbidden(),
    }),

    endDate: Joi.string().when("isRecurring", {
        is: Joi.valid(false).required(),
        then: Joi.optional(),
        otherwise: Joi.forbidden(),
    }),

    startTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .when("isRecurring", {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.forbidden(),
        })
        .messages({
            "string.pattern.base": "startTime must be in HH:mm 24-hour format",
        }),

    endTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .when("isRecurring", {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.forbidden(),
        })
        .messages({
            "string.pattern.base": "endTime must be in HH:mm 24-hour format",
        }),

    daysOfWeek: Joi.array()
        .items(
            Joi.string().valid("mon", "tue", "wed", "thu", "fri", "sat", "sun")
        )
        .min(1)
        .when("isRecurring", {
            is: true,
            then: Joi.optional(),
            otherwise: Joi.forbidden(),
        })
        .messages({
            "any.only":
                "daysOfWeek must be one of mon, tue, wed, thu, fri, sat, sun",
        }),
});

const addSessionValidationSchema = Joi.object({
    title: Joi.string().trim().required().min(5).max(128),
    description: Joi.string().trim().min(5).max(1024),
    category: Joi.string().trim().required().min(4).max(32),
    slots: Joi.array().items(addSchema).required(),
    thumbnail: Joi.string().uri(),
    amount: Joi.number().min(1).required(),
});

const updateSessionValidationSchema = Joi.object({
    title: Joi.string().trim().min(5).max(128),
    description: Joi.string().trim().min(5).max(1024),
    category: Joi.string().trim().min(4).max(32),
    slots: Joi.array().items(updateSchema),
    thumbnail: Joi.string().uri(),
    amount: Joi.number().min(1).required(),
});

module.exports = { addSessionValidationSchema, updateSessionValidationSchema };

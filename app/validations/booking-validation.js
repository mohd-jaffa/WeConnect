const Joi = require("joi");

const datePattern =
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

const bookingsValidationSchema = Joi.object({
    time: Joi.object({
        start: Joi.string().required().pattern(datePattern).messages({
            "string.pattern.base":
                "start must be in YYYY-MM-DDTHH:MM:SS format",
            "any.required": "start time is required",
        }),
        end: Joi.string()
            .required()
            .pattern(datePattern)
            .custom((value, helpers) => {
                const start = helpers?.state?.ancestors?.[0]?.time?.start;
                if (!start) return value;
                if (value <= start) {
                    return helpers.error("time.invalid", {
                        message: "end must be after start",
                    });
                }
                return value;
            })
            .messages({
                "string.pattern.base":
                    "end must be in YYYY-MM-DDTHH:MM:SS format",
                "any.required": "end time is required",
                "time.invalid": "end time must be after start time",
            }),
    })
        .required()
        .messages({
            "object.base": "time must be an object with start and end",
            "any.required": "time is required",
        }),

    details: Joi.string().trim().required().length(24).hex(),
});

module.exports = bookingsValidationSchema;

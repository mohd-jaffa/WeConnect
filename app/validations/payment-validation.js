const Joi = require("joi");

const paymentValidationSchema = Joi.object({
    orderId: Joi.string().trim().required(),
    sessionId: Joi.string().trim().required(),
    userId: Joi.string().trim().required(),
    status: Joi.string().required(),
    amount: Joi.number().min(1).required(),
});

module.exports = paymentValidationSchema;

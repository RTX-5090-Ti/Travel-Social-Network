import Joi from "joi";

export const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().trim().min(2).max(50).required(),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required(),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

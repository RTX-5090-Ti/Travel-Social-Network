import Joi from "joi";

export const listFeedSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional(),
    cursor: Joi.string().trim().allow("").optional(),
    mode: Joi.string().valid("trending", "latest").optional(),
  }),
  params: Joi.object(),
});

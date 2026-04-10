import Joi from "joi";

const objectIdSchema = Joi.string().trim().hex().length(24);

export const tripReactionSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

export const commentReactionSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    commentId: objectIdSchema.required(),
  }),
});

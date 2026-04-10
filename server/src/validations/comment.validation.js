import Joi from "joi";

const objectIdSchema = Joi.string().trim().hex().length(24);

const commentContentSchema = Joi.string().trim().allow("").max(5000);

export const listTripCommentsSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional(),
    cursor: Joi.string().trim().allow("", null).optional(),
  }),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

export const getCommentByIdSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    commentId: objectIdSchema.required(),
  }),
});

export const createTripCommentSchema = Joi.object({
  body: Joi.object({
    content: commentContentSchema.required(),
    parentCommentId: objectIdSchema.allow("", null).optional(),
  }),
  query: Joi.object(),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

export const createTripCommentGifSchema = Joi.object({
  body: Joi.object({
    content: commentContentSchema.optional(),
    gifUrl: Joi.string().uri().required(),
    parentCommentId: objectIdSchema.allow("", null).optional(),
    width: Joi.number().integer().min(1).allow(null).optional(),
    height: Joi.number().integer().min(1).allow(null).optional(),
  }),
  query: Joi.object(),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

export const createTripCommentImageSchema = Joi.object({
  body: Joi.object({
    content: commentContentSchema.optional(),
    parentCommentId: objectIdSchema.allow("", null).optional(),
  }),
  query: Joi.object(),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

export const updateCommentSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().trim().max(5000).required(),
  }),
  query: Joi.object(),
  params: Joi.object({
    commentId: objectIdSchema.required(),
  }),
});

export const deleteCommentSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    commentId: objectIdSchema.required(),
  }),
});

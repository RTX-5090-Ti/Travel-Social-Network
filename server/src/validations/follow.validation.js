import Joi from "joi";

const objectIdSchema = Joi.string().trim().hex().length(24);

const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

export const followUserParamsSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    userId: objectIdSchema.required(),
  }),
});

export const listMutualFollowsSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(200).optional(),
  }),
  params: Joi.object(),
});

export const listSuggestedFollowsSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(20).optional(),
  }),
  params: Joi.object(),
});

export const listOwnFollowUsersSchema = Joi.object({
  body: Joi.object(),
  query: paginationQuerySchema,
  params: Joi.object(),
});

export const listUserFollowUsersSchema = Joi.object({
  body: Joi.object(),
  query: paginationQuerySchema,
  params: Joi.object({
    userId: objectIdSchema.required(),
  }),
});

import Joi from "joi";

const objectIdSchema = Joi.string().trim().hex().length(24);

export const emptyAdminSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object(),
});

export const listAdminUsersSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    search: Joi.string().trim().allow("").optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
  }),
  params: Joi.object(),
});

export const updateAdminUserStateSchema = Joi.object({
  body: Joi.object({
    isActive: Joi.boolean().required(),
  }),
  query: Joi.object(),
  params: Joi.object({
    userId: objectIdSchema.required(),
  }),
});

export const updateAdminTripStateSchema = Joi.object({
  body: Joi.object({
    trashed: Joi.boolean().required(),
  }),
  query: Joi.object(),
  params: Joi.object({
    tripId: objectIdSchema.required(),
  }),
});

export const listAdminTripsSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    search: Joi.string().trim().allow("").optional(),
    privacy: Joi.string()
      .valid("public", "followers", "private", "trashed")
      .allow("")
      .optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(50).optional(),
  }),
  params: Joi.object(),
});

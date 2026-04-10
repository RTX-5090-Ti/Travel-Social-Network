import Joi from "joi";

const objectIdSchema = Joi.string().trim().hex().length(24);

export const listNotificationsSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional(),
    cursor: Joi.string().trim().allow("").optional(),
  }),
  params: Joi.object(),
});

export const markNotificationReadSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    notificationId: objectIdSchema.required(),
  }),
});

export const deleteSelectedNotificationsSchema = Joi.object({
  body: Joi.object({
    notificationIds: Joi.array().items(objectIdSchema).default([]),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

export const emptyNotificationActionSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object(),
});

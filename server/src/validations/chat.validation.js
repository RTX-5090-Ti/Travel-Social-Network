import Joi from "joi";

const objectIdSchema = Joi.string().trim().hex().length(24);

export const listConversationMessagesSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  params: Joi.object({
    conversationId: objectIdSchema.required(),
  }),
});

export const openDirectConversationSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    userId: objectIdSchema.required(),
  }),
});

export const sendMessageSchema = Joi.object({
  body: Joi.object({
    text: Joi.string().trim().max(5000).required(),
  }),
  query: Joi.object(),
  params: Joi.object({
    conversationId: objectIdSchema.required(),
  }),
});

export const sendImageMessageSchema = Joi.object({
  body: Joi.object({
    text: Joi.string().trim().allow("").max(5000).optional(),
  }),
  query: Joi.object(),
  params: Joi.object({
    conversationId: objectIdSchema.required(),
  }),
});

export const sendGifMessageSchema = Joi.object({
  body: Joi.object({
    text: Joi.string().trim().allow("").max(5000).optional(),
    gifUrl: Joi.string().uri().required(),
    width: Joi.number().integer().min(1).allow(null).optional(),
    height: Joi.number().integer().min(1).allow(null).optional(),
  }),
  query: Joi.object(),
  params: Joi.object({
    conversationId: objectIdSchema.required(),
  }),
});

export const markConversationReadSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    conversationId: objectIdSchema.required(),
  }),
});

export const deleteSelectedConversationsSchema = Joi.object({
  body: Joi.object({
    conversationIds: Joi.array().items(objectIdSchema).min(1).required(),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

import Joi from "joi";

const objectIdSchema = Joi.string().trim().hex().length(24);

const mediaSchema = Joi.object({
  type: Joi.string().valid("image", "video").required(),
  url: Joi.string().uri().required(),
  publicId: Joi.string().required(),
  width: Joi.number().allow(null),
  height: Joi.number().allow(null),
  duration: Joi.number().allow(null),
  bytes: Joi.number().allow(null),
});

const tripItemSchema = Joi.object({
  milestoneTempId: Joi.string().allow(null, ""),
  content: Joi.string().allow("", null).max(5000),
  media: Joi.array().items(mediaSchema).max(6).default([]),
  order: Joi.number().integer().min(0).default(0),
});

const milestoneSchema = Joi.object({
  tempId: Joi.string().required(),
  title: Joi.string().trim().max(120).required(),
  time: Joi.date().iso().allow(null),
  order: Joi.number().integer().min(0).default(0),
});

export const createTripSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().max(120).required(),
    caption: Joi.string().allow("", null).max(2000),

    privacy: Joi.string()
      .valid("public", "followers", "private")
      .default("public"),

    participantIds: Joi.array().items(objectIdSchema).default([]),

    milestones: Joi.array().items(milestoneSchema).default([]),
    items: Joi.array().items(tripItemSchema).default([]),
  }),
  query: Joi.object(),
  params: Joi.object(),
});

export const updateTripPrivacySchema = Joi.object({
  body: Joi.object({
    privacy: Joi.string().valid("public", "followers", "private").required(),
  }),
  query: Joi.object(),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

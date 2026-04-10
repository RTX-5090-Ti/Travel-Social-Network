import Joi from "joi";
import {
  PROFILE_LOCATION_OPTIONS,
  TRAVEL_STYLE_KEYS,
} from "../constants/profile.constants.js";

const objectIdSchema = Joi.string().trim().hex().length(24);

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50),
    bio: Joi.string().trim().allow("").max(160),
    location: Joi.string()
      .trim()
      .valid("", ...PROFILE_LOCATION_OPTIONS),
    travelStyle: Joi.string()
      .trim()
      .valid("", ...TRAVEL_STYLE_KEYS),
  }).min(1),
  query: Joi.object(),
  params: Joi.object(),
});

export const getMyTripsSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  params: Joi.object(),
});

export const getUserSummarySchema = Joi.object({
  body: Joi.object(),
  query: Joi.object(),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

export const getUserProfileSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

export const getUserProfileMediaSchema = Joi.object({
  body: Joi.object(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(200).optional(),
  }),
  params: Joi.object({
    id: objectIdSchema.required(),
  }),
});

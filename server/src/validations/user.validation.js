import Joi from "joi";
import {
  PROFILE_LOCATION_OPTIONS,
  TRAVEL_STYLE_KEYS,
} from "../constants/profile.constants.js";

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

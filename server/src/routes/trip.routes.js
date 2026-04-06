import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  createTripSchema,
  updateTripPinSchema,
  updateTripPrivacySchema,
} from "../validations/trip.validation.js";
import {
  createTrip,
  getTripDetail,
  pinTrip,
  unpinTrip,
  updateTripPrivacy,
} from "../controllers/trip.controller.js";

const router = Router();

router.post("/", requireAuth, validate(createTripSchema), createTrip);

router.patch(
  "/:id/privacy",
  requireAuth,
  validate(updateTripPrivacySchema),
  updateTripPrivacy,
);

router.put("/:id/pin", requireAuth, validate(updateTripPinSchema), pinTrip);

router.delete(
  "/:id/pin",
  requireAuth,
  validate(updateTripPinSchema),
  unpinTrip,
);

router.get("/:id", requireAuth, getTripDetail);

export default router;

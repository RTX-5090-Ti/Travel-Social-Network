import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  createTripSchema,
  updateTripPrivacySchema,
} from "../validations/trip.validation.js";
import {
  createTrip,
  getTripDetail,
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

router.get("/:id", requireAuth, getTripDetail);

export default router;

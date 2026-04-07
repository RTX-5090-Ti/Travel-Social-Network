import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  createTripSchema,
  listSavedTripsSchema,
  listTripTrashSchema,
  updateTripPinSchema,
  updateTripPrivacySchema,
  updateTripSaveSchema,
  updateTripTrashSchema,
} from "../validations/trip.validation.js";
import {
  createTrip,
  getTripDetail,
  listSavedTrips,
  listTrashedTrips,
  moveTripToTrash,
  pinTrip,
  restoreTripFromTrash,
  saveTrip,
  unpinTrip,
  unsaveTrip,
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

router.get("/trash", requireAuth, validate(listTripTrashSchema), listTrashedTrips);

router.get("/saved", requireAuth, validate(listSavedTripsSchema), listSavedTrips);

router.post(
  "/:id/save",
  requireAuth,
  validate(updateTripSaveSchema),
  saveTrip,
);

router.delete(
  "/:id/save",
  requireAuth,
  validate(updateTripSaveSchema),
  unsaveTrip,
);

router.patch(
  "/:id/trash",
  requireAuth,
  validate(updateTripTrashSchema),
  moveTripToTrash,
);

router.patch(
  "/:id/restore",
  requireAuth,
  validate(updateTripTrashSchema),
  restoreTripFromTrash,
);

router.get("/:id", requireAuth, getTripDetail);

export default router;

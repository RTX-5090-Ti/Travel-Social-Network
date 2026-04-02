import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { createTripSchema } from "../validations/trip.validation.js";
import { createTrip, getTripDetail } from "../controllers/trip.controller.js";

const router = Router();

router.post("/", requireAuth, validate(createTripSchema), createTrip);
router.get("/:id", getTripDetail);

export default router;

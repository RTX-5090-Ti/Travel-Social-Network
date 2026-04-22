import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import {
  getAdminDashboard,
  getAdminTrips,
  getAdminUsers,
  updateAdminTripState,
  updateAdminUserState,
} from "../controllers/admin.controller.js";
import {
  emptyAdminSchema,
  listAdminTripsSchema,
  listAdminUsersSchema,
  updateAdminTripStateSchema,
  updateAdminUserStateSchema,
} from "../validations/admin.validation.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/health", (req, res) =>
  res.json({ ok: true, role: req.user.role }),
);
router.get("/dashboard", validate(emptyAdminSchema), getAdminDashboard);
router.get("/users", validate(listAdminUsersSchema), getAdminUsers);
router.get("/trips", validate(listAdminTripsSchema), getAdminTrips);
router.patch("/users/:userId/state", validate(updateAdminUserStateSchema), updateAdminUserState);
router.patch("/trips/:tripId/state", validate(updateAdminTripStateSchema), updateAdminTripState);

export default router;

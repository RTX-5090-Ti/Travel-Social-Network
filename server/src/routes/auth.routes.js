import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  reactivateAccountSchema,
} from "../validations/auth.validation.js";
import {
  register,
  login,
  logout,
  me,
  refresh,
  changePassword,
  deactivateAccount,
  reactivateAccount,
  requestAccountDeletion,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post(
  "/reactivate",
  validate(reactivateAccountSchema),
  reactivateAccount,
);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/deactivate", requireAuth, deactivateAccount);
router.patch("/delete-account", requireAuth, requestAccountDeletion);
router.patch(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  changePassword,
);

export default router;

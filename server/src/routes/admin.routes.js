import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/health", (req, res) =>
  res.json({ ok: true, role: req.user.role }),
);

export default router;

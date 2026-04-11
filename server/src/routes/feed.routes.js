import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { getFeed } from "../controllers/feed.controller.js";
import { listFeedSchema } from "../validations/feed.validation.js";

const router = Router();

router.get("/", requireAuth, validate(listFeedSchema), getFeed);

export default router;

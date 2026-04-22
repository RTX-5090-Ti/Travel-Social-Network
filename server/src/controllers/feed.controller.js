import {
  FEED_MODE,
  getFeedForUser,
  __testables,
} from "../services/feed.service.js";

export async function getFeed(req, res, next) {
  try {
    const userId = req.user?.userId;
    const mode =
      req.validated?.query?.mode === FEED_MODE.LATEST
        ? FEED_MODE.LATEST
        : FEED_MODE.TRENDING;

    const limitRaw = Number(req.validated?.query?.limit ?? req.query.limit ?? 20);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20;

    const result = await getFeedForUser({
      userId,
      limit,
      mode,
      cursor: req.validated?.query?.cursor ?? req.query.cursor,
      now: new Date(),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export { __testables };

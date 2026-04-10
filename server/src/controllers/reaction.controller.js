import * as reactionService from "../services/reaction.service.js";

function handleServiceError(res, err) {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }

  throw err;
}

export async function toggleTripHeart(req, res, next) {
  try {
    const payload = await reactionService.toggleTripHeart({
      userId: req.user.userId,
      tripId: req.validated?.params?.id || req.params.id,
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function getTripHeartSummary(req, res, next) {
  try {
    const payload = await reactionService.getTripHeartSummary({
      userId: req.user?.userId,
      tripId: req.validated?.params?.id || req.params.id,
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function toggleCommentLike(req, res, next) {
  try {
    const payload = await reactionService.toggleCommentLike({
      userId: req.user.userId,
      commentId: req.validated?.params?.commentId || req.params.commentId,
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

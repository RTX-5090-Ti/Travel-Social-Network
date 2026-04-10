import * as userService from "../services/user.service.js";

function handleServiceError(res, err) {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }

  throw err;
}

export async function uploadAvatarController(req, res, next) {
  try {
    const payload = await userService.uploadAvatar({
      userId: req.user?.userId,
      file: req.file,
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

export async function getMyTripsController(req, res, next) {
  try {
    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const payload = await userService.getMyTrips({
      userId: req.user?.userId,
      limit,
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

export async function getUserProfileController(req, res, next) {
  try {
    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 50;

    const payload = await userService.getUserProfile({
      viewerId: req.user?.userId,
      profileUserId: req.params.id,
      limit,
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

export async function getUserSummaryController(req, res, next) {
  try {
    const payload = await userService.getUserSummary({
      viewerId: req.user?.userId,
      profileUserId: req.params.id,
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

export async function getUserProfileMediaController(req, res, next) {
  try {
    const limitRaw = Number(req.query.limit ?? 0);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.max(limitRaw, 1), 200)
        : null;

    const payload = await userService.getUserProfileMedia({
      viewerId: req.user?.userId,
      profileUserId: req.params.id,
      limit,
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

export async function updateProfileController(req, res, next) {
  try {
    const payload = await userService.updateProfile({
      userId: req.user?.userId,
      body: req.validated?.body ?? req.body ?? {},
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

export async function uploadCoverController(req, res, next) {
  try {
    const payload = await userService.uploadCover({
      userId: req.user?.userId,
      file: req.file,
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

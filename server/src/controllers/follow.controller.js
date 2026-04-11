import * as followService from "../services/follow.service.js";

function handleServiceError(res, err) {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }

  throw err;
}

export async function followUser(req, res, next) {
  try {
    const payload = await followService.followUser({
      followerId: req.user.userId,
      followingId: req.validated?.params?.userId || req.params.userId,
    });

    res.status(201).json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function unfollowUser(req, res, next) {
  try {
    const payload = await followService.unfollowUser({
      followerId: req.user.userId,
      followingId: req.validated?.params?.userId || req.params.userId,
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

export async function getFollowStatus(req, res, next) {
  try {
    const payload = await followService.getFollowStatus({
      followerId: req.user.userId,
      followingId: req.validated?.params?.userId || req.params.userId,
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

export async function getFollowSummary(req, res, next) {
  try {
    const payload = await followService.getFollowSummary({
      userId: req.user.userId,
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

export async function listMutualFollows(req, res, next) {
  try {
    const payload = await followService.listMutualFollows({
      userId: req.user.userId,
      limit: req.validated?.query?.limit ?? 10,
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

export async function listSuggestedFollows(req, res, next) {
  try {
    const payload = await followService.listSuggestedFollows({
      userId: req.user.userId,
      limit: req.validated?.query?.limit ?? 5,
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

export async function listFollowers(req, res, next) {
  try {
    const payload = await followService.listFollowers({
      currentUserId: req.user.userId,
      page: req.validated?.query?.page ?? 1,
      limit: req.validated?.query?.limit ?? 12,
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

export async function listFollowing(req, res, next) {
  try {
    const payload = await followService.listFollowing({
      currentUserId: req.user.userId,
      page: req.validated?.query?.page ?? 1,
      limit: req.validated?.query?.limit ?? 12,
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

export async function listFollowersByUserId(req, res, next) {
  try {
    const payload = await followService.listFollowersByUserId({
      viewerId: req.user.userId,
      targetUserId: req.validated?.params?.userId || req.params.userId,
      page: req.validated?.query?.page ?? 1,
      limit: req.validated?.query?.limit ?? 12,
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

export async function listFollowingByUserId(req, res, next) {
  try {
    const payload = await followService.listFollowingByUserId({
      viewerId: req.user.userId,
      targetUserId: req.validated?.params?.userId || req.params.userId,
      page: req.validated?.query?.page ?? 1,
      limit: req.validated?.query?.limit ?? 12,
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

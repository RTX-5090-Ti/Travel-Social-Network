import * as tripService from "../services/trip.service.js";

function handleServiceError(res, err) {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }

  throw err;
}

export async function createTrip(req, res, next) {
  try {
    const payload = await tripService.createTrip({
      userId: req.user.userId,
      title: req.body.title,
      caption: req.body.caption,
      privacy: req.body.privacy ?? "public",
      participantIds: req.body.participantIds ?? [],
      milestones: req.body.milestones ?? [],
      items: req.body.items ?? [],
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

export async function updateTrip(req, res, next) {
  try {
    const payload = await tripService.updateTrip({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
      title: req.body.title,
      caption: req.body.caption,
      privacy: req.body.privacy ?? "public",
      participantIds: req.body.participantIds ?? [],
      milestones: req.body.milestones ?? [],
      items: req.body.items ?? [],
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

export async function updateTripPrivacy(req, res, next) {
  try {
    const payload = await tripService.updateTripPrivacy({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
      privacy: req.validated?.body?.privacy || req.body?.privacy,
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

export async function pinTrip(req, res, next) {
  try {
    const payload = await tripService.pinTrip({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
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

export async function unpinTrip(req, res, next) {
  try {
    const payload = await tripService.unpinTrip({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
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

export async function saveTrip(req, res, next) {
  try {
    const payload = await tripService.saveTrip({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
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

export async function unsaveTrip(req, res, next) {
  try {
    const payload = await tripService.unsaveTrip({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
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

export async function hideTripForViewer(req, res, next) {
  try {
    const payload = await tripService.hideTripForViewer({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
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

export async function moveTripToTrash(req, res, next) {
  try {
    const payload = await tripService.moveTripToTrash({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
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

export async function restoreTripFromTrash(req, res, next) {
  try {
    const payload = await tripService.restoreTripFromTrash({
      tripId: req.validated?.params?.id || req.params.id,
      userId: req.user?.userId,
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

export async function listTrashedTrips(req, res, next) {
  try {
    const payload = await tripService.listTrashedTrips({
      userId: req.user?.userId,
      limit: req.validated?.query?.limit ?? 50,
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

export async function listSavedTrips(req, res, next) {
  try {
    const payload = await tripService.listSavedTrips({
      userId: req.user?.userId,
      limit: req.validated?.query?.limit ?? 50,
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

export async function getTripDetail(req, res, next) {
  try {
    const payload = await tripService.getTripDetail({
      tripId: req.validated?.params?.id || req.params.id,
      viewerId: req.user.userId,
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

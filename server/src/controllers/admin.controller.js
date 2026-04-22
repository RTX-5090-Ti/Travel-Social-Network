import {
  getAdminDashboardStats,
  listAdminTrips,
  listAdminUsers,
  setAdminTripTrashState,
  setAdminUserActiveState,
} from "../services/admin.service.js";

function normalizePage(value, fallback) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(1, nextValue) : fallback;
}

function normalizeLimit(value, fallback, max = 50) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue)
    ? Math.min(Math.max(1, nextValue), max)
    : fallback;
}

export async function getAdminDashboard(req, res, next) {
  try {
    const result = await getAdminDashboardStats();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminUsers(req, res, next) {
  try {
    const result = await listAdminUsers({
      search: req.validated?.query?.search ?? req.query.search ?? "",
      page: normalizePage(req.validated?.query?.page ?? req.query.page, 1),
      limit: normalizeLimit(req.validated?.query?.limit ?? req.query.limit, 12),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminTrips(req, res, next) {
  try {
    const result = await listAdminTrips({
      search: req.validated?.query?.search ?? req.query.search ?? "",
      privacy: req.validated?.query?.privacy ?? req.query.privacy ?? "",
      page: normalizePage(req.validated?.query?.page ?? req.query.page, 1),
      limit: normalizeLimit(req.validated?.query?.limit ?? req.query.limit, 12),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateAdminUserState(req, res, next) {
  try {
    const result = await setAdminUserActiveState({
      targetUserId: req.validated?.params?.userId ?? req.params.userId,
      adminUserId: req.user?._id,
      isActive: req.validated?.body?.isActive,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateAdminTripState(req, res, next) {
  try {
    const result = await setAdminTripTrashState({
      tripId: req.validated?.params?.tripId ?? req.params.tripId,
      trashed: Boolean(req.validated?.body?.trashed),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

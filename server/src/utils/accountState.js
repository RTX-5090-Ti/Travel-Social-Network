export function hasPendingDeletion(user) {
  return Boolean(user?.scheduledDeletionAt);
}

export function isDeactivated(user) {
  return user?.isActive === false && !hasPendingDeletion(user);
}

export function getAccountState(user) {
  if (!user) return "missing";
  if (hasPendingDeletion(user)) return "pending_deletion";
  if (isDeactivated(user)) return "deactivated";
  return "active";
}

export function isAccountActive(user) {
  return getAccountState(user) === "active";
}

export function isAccountReactivatable(user) {
  const state = getAccountState(user);
  return state === "deactivated" || state === "pending_deletion";
}

export function isPendingDeletionExpired(user, now = new Date()) {
  if (!hasPendingDeletion(user)) return false;

  return new Date(user.scheduledDeletionAt).getTime() <= now.getTime();
}

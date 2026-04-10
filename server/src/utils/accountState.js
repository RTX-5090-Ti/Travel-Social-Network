// có đang ở trạng thái chờ bị xoá hay không.
export function hasPendingDeletion(user) {
  return Boolean(user?.scheduledDeletionAt);
}

// TK bị vô hiệu hoá  chưa
export function isDeactivated(user) {
  return user?.isActive === false && !hasPendingDeletion(user);
}

// trả về trạng thái: 4 trang thái
export function getAccountState(user) {
  if (!user) return "missing";
  if (hasPendingDeletion(user)) return "pending_deletion";
  if (isDeactivated(user)) return "deactivated";
  return "active";
}

export function isAccountActive(user) {
  return getAccountState(user) === "active";
}

// có thể kich hoạt tk được không
export function isAccountReactivatable(user) {
  const state = getAccountState(user);
  return state === "deactivated" || state === "pending_deletion";
}

// thời gian chờ xoá hết chưa
export function isPendingDeletionExpired(user, now = new Date()) {
  if (!hasPendingDeletion(user)) return false;

  return new Date(user.scheduledDeletionAt).getTime() <= now.getTime();
}

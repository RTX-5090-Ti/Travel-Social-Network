export function getUserAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

export function getEntityId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value?._id || value?.id || "";
}

export function hasEmbeddedDetail(trip) {
  return Boolean(
    (Array.isArray(trip?.generalItems) && trip.generalItems.length > 0) ||
    (Array.isArray(trip?.milestones) && trip.milestones.length > 0),
  );
}

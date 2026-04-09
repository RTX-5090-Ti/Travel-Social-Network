export function normalizeNotificationActor(user) {
  if (!user || user?.scheduledDeletionAt || user?.isActive === false) {
    return {
      _id: null,
      name: "Unavailable user",
      avatarUrl: "",
      unavailable: true,
    };
  }

  return {
    _id: user?._id || null,
    name: user?.name || "Traveler",
    avatarUrl: user?.avatarUrl || "",
    unavailable: false,
  };
}

export function buildNotificationMessage(notification) {
  const actorName = notification?.actor?.name || "Một người dùng";

  switch (notification?.type) {
    case "follow":
      return `${actorName} đã theo dõi bạn.`;
    case "trip_comment":
      return `${actorName} đã bình luận về journey của bạn.`;
    case "comment_reply":
      return `${actorName} đã trả lời bình luận của bạn.`;
    case "trip_like":
      return `${actorName} đã thích journey của bạn.`;
    case "comment_like":
      return `${actorName} đã thích bình luận của bạn.`;
    default:
      return `${actorName} đã tương tác với bạn.`;
  }
}

export function normalizeNotificationPayload(notification) {
  const actor = normalizeNotificationActor(
    notification?.actorUserId || notification?.actor,
  );

  return {
    _id: notification?._id || null,
    id: notification?._id || null,
    type: notification?.type || "follow",
    actor,
    tripId: notification?.tripId || null,
    commentId: notification?.commentId || null,
    payload: notification?.payload || {},
    read: !!notification?.readAt,
    readAt: notification?.readAt || null,
    createdAt: notification?.createdAt || null,
    message: buildNotificationMessage({
      ...notification,
      actor,
    }),
  };
}

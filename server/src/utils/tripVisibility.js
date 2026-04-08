import Follow from "../models/Follow.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";

function normalizePrivacy(privacy) {
  if (["public", "followers", "private"].includes(privacy)) {
    return privacy;
  }

  return "public";
}

function extractOwnerId(ownerId) {
  if (!ownerId) return null;

  if (typeof ownerId === "string") return ownerId;

  if (ownerId?._id) return ownerId._id.toString();

  return ownerId.toString();
}

export function canViewerAccessTrip({
  trip,
  viewerId,
  isFollowingOwner = false,
}) {
  if (!trip) return false;
  if (trip.deletedAt) return false;

  const privacy = normalizePrivacy(trip.privacy);
  const ownerId = extractOwnerId(trip.ownerId);
  const viewerIdString = viewerId ? viewerId.toString() : null;

  if (!ownerId) {
    return false;
  }

  if (ownerId && viewerIdString && ownerId === viewerIdString) {
    return true;
  }

  if (privacy === "public") {
    return true;
  }

  if (privacy === "private") {
    return false;
  }

  if (privacy === "followers") {
    return Boolean(isFollowingOwner);
  }

  return false;
}

export async function getTripAccessContext({
  tripId,
  viewerId,
  select = "_id ownerId privacy",
  populateOwner = false,
}) {
  let query = Trip.findById(tripId).select(`${select} deletedAt`);

  if (populateOwner) {
    query = query.populate("ownerId", "name avatarUrl");
  }

  const trip = await query.lean();

  if (!trip) {
    return {
      trip: null,
      isFollowingOwner: false,
      canView: false,
    };
  }

  const ownerId = extractOwnerId(trip.ownerId);
  const viewerIdString = viewerId ? viewerId.toString() : null;

  if (!ownerId) {
    return {
      trip,
      isFollowingOwner: false,
      canView: false,
    };
  }

  const ownerIsActive = await User.exists({
    _id: ownerId,
    isActive: { $ne: false },
  });

  if (!ownerIsActive) {
    return {
      trip,
      isFollowingOwner: false,
      canView: false,
    };
  }

  let isFollowingOwner = false;

  if (ownerId && viewerIdString && ownerId !== viewerIdString) {
    const followDoc = await Follow.findOne({
      followerId: viewerIdString,
      followingId: ownerId,
    })
      .select("_id")
      .lean();

    isFollowingOwner = !!followDoc;
  }

  return {
    trip,
    isFollowingOwner,
    canView: canViewerAccessTrip({
      trip,
      viewerId: viewerIdString,
      isFollowingOwner,
    }),
  };
}

export function getVisibleTripPrivaciesForOwner({
  ownerId,
  viewerId,
  isFollowingOwner = false,
}) {
  const ownerIdString = extractOwnerId(ownerId);
  const viewerIdString = viewerId ? viewerId.toString() : null;

  if (ownerIdString && viewerIdString && ownerIdString === viewerIdString) {
    return ["public", "followers", "private"];
  }

  if (isFollowingOwner) {
    return ["public", "followers"];
  }

  return ["public"];
}

export function buildOwnerTripVisibilityFilter({
  ownerId,
  viewerId,
  isFollowingOwner = false,
}) {
  return {
    ownerId,
    deletedAt: null,
    privacy: {
      $in: getVisibleTripPrivaciesForOwner({
        ownerId,
        viewerId,
        isFollowingOwner,
      }),
    },
  };
}

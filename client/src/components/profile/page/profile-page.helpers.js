import { Grid3X3, ImageIcon } from "lucide-react";

export function formatLargeNumber(value = 0) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

export function getUserAvatar(user) {
  return (
    user?.avatarUrl ||
    user?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar ||
    ""
  );
}

export function collectProfileMedia(trips = []) {
  const output = [];
  const seen = new Set();

  for (const trip of trips) {
    const sourceMedia =
      Array.isArray(trip?.profileMedia) && trip.profileMedia.length
        ? trip.profileMedia
        : Array.isArray(trip?.feedPreview?.previewMedia)
          ? trip.feedPreview.previewMedia
          : [];

    for (const media of sourceMedia) {
      if (!media?.url) continue;

      const dedupeKey = `${trip?._id || "trip"}-${media.url}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      output.push({
        id: dedupeKey,
        url: media.url,
        type: media.type === "video" ? "video" : "image",
        tripId: trip?._id,
        tripTitle: trip?.title || "Untitled journey",
        privacy: trip?.privacy || "public",
        createdAt: trip?.createdAt,
        milestoneTitle: media?.milestoneTitle || null,
      });
    }
  }

  return output;
}

export function getTripId(trip) {
  return trip?._id || trip?.id || trip?.tripId || "";
}

export const PROFILE_TABS = [
  { key: "posts", label: "Posts", icon: Grid3X3 },
  { key: "media", label: "Media", icon: ImageIcon },
];

export const PROFILE_COVER_URL =
  "https://plus.unsplash.com/premium_photo-1675826539716-54a369329428?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export const EMPTY_ARRAY = [];

export function getInitials(name = "Traveler") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "T"
  );
}

export function formatFeedTime(value) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("vi-VN");
}

export function getPrivacyLabel(value) {
  if (value === "followers") return "Followers";
  if (value === "private") return "Private";
  return "Public";
}

export function countJourneyMedia(detail) {
  const generalCount =
    detail?.generalItems?.reduce(
      (sum, item) => sum + (item.media?.length || 0),
      0,
    ) || 0;

  const milestoneCount =
    detail?.milestones?.reduce(
      (sum, milestone) =>
        sum +
        (milestone.items?.reduce(
          (itemSum, item) => itemSum + (item.media?.length || 0),
          0,
        ) || 0),
      0,
    ) || 0;

  return generalCount + milestoneCount;
}

export function formatMilestoneTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

export function extractJourneyPreviewMedia(detail) {
  const generalMedia =
    detail?.generalItems?.flatMap((item) =>
      (item.media || []).map((media) => ({
        ...media,
        source: "general",
      })),
    ) || [];

  const milestoneMedia =
    detail?.milestones?.flatMap((milestone) =>
      (milestone.items || []).flatMap((item) =>
        (item.media || []).map((media) => ({
          ...media,
          source: milestone.title || "milestone",
        })),
      ),
    ) || [];

  const merged = [...generalMedia, ...milestoneMedia];

  const uniqueMap = new Map();
  for (const media of merged) {
    if (!media?.url) continue;
    if (!uniqueMap.has(media.url)) {
      uniqueMap.set(media.url, media);
    }
  }

  return Array.from(uniqueMap.values());
}

export const previewSlideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 1,
    scale: 1,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 1,
    scale: 1,
  }),
};

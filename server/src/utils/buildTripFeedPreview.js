function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sortByOrderThenCreatedAt(a, b) {
  const aOrder = Number.isFinite(Number(a?.order)) ? Number(a.order) : 0;
  const bOrder = Number.isFinite(Number(b?.order)) ? Number(b.order) : 0;

  if (aOrder !== bOrder) return aOrder - bOrder;

  const aCreated = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bCreated = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

  return aCreated - bCreated;
}

function getMilestoneKey(milestone) {
  return (
    milestone?._id?.toString?.() ||
    milestone?.id?.toString?.() ||
    milestone?.tempId ||
    null
  );
}

function getItemMilestoneKey(item) {
  return item?.milestoneId?.toString?.() || item?.milestoneTempId || null;
}

function normalizeMediaType(type) {
  return type === "video" ? "video" : "image";
}

function isPreviewableMedia(media) {
  const type = normalizeMediaType(media?.type);
  return (type === "image" || type === "video") && !!safeString(media?.url);
}

function makePreviewEntry(media, milestone = null) {
  return {
    url: safeString(media.url),
    type: normalizeMediaType(media?.type),
    width: media?.width ?? null,
    height: media?.height ?? null,
    duration: media?.duration ?? null,
    milestoneTitle: milestone?.title || null,
  };
}

function dedupeByUrl(list = []) {
  const seen = new Set();
  const output = [];

  for (const item of list) {
    const url = safeString(item?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push({ ...item, url });
  }

  return output;
}

export function buildTripFeedPreview(
  { milestones = [], items = [] } = {},
  options = {},
) {
  const maxPreviewMedia = Math.min(
    Math.max(
      Number(options.maxPreviewMedia ?? options.maxPreviewImages) || 6,
      1,
    ),
    6,
  );

  const sortedMilestones = [...milestones].sort(sortByOrderThenCreatedAt);
  const sortedItems = [...items].sort(sortByOrderThenCreatedAt);

  const itemsByMilestone = new Map();
  const generalItems = [];

  for (const item of sortedItems) {
    const key = getItemMilestoneKey(item);

    if (!key) {
      generalItems.push(item);
      continue;
    }

    if (!itemsByMilestone.has(key)) {
      itemsByMilestone.set(key, []);
    }

    itemsByMilestone.get(key).push(item);
  }

  const milestonePrimaryMedia = [];
  const milestoneExtraMedia = [];

  for (const milestone of sortedMilestones) {
    const key = getMilestoneKey(milestone);
    const milestoneItems = itemsByMilestone.get(key) || [];

    const milestoneMedia = [];

    for (const item of milestoneItems) {
      for (const media of item.media || []) {
        if (!isPreviewableMedia(media)) continue;
        milestoneMedia.push(makePreviewEntry(media, milestone));
      }
    }

    const uniqueMilestoneMedia = dedupeByUrl(milestoneMedia);

    if (uniqueMilestoneMedia[0]) {
      milestonePrimaryMedia.push(uniqueMilestoneMedia[0]);
    }

    if (uniqueMilestoneMedia.length > 1) {
      milestoneExtraMedia.push(...uniqueMilestoneMedia.slice(1));
    }
  }

  const generalMedia = dedupeByUrl(
    generalItems.flatMap((item) =>
      (item.media || [])
        .filter(isPreviewableMedia)
        .map((media) => makePreviewEntry(media)),
    ),
  );

  const allUniqueMedia = dedupeByUrl([
    ...milestonePrimaryMedia,
    ...milestoneExtraMedia,
    ...generalMedia,
  ]);

  const previewMedia = allUniqueMedia
    .slice(0, maxPreviewMedia)
    .map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

  const imageCount = allUniqueMedia.filter(
    (item) => item.type === "image",
  ).length;
  const videoCount = allUniqueMedia.filter(
    (item) => item.type === "video",
  ).length;

  return {
    milestoneCount: sortedMilestones.length,
    mediaCount: allUniqueMedia.length,
    imageCount,
    videoCount,
    hasMoreMedia: allUniqueMedia.length > previewMedia.length,
    previewMedia,
  };
}

export function getMediaRenderKey(item, index, prefix = "media") {
  if (item?._id) return `${prefix}-${item._id}`;
  if (item?.publicId) return `${prefix}-${item.publicId}`;
  if (item?.url) return `${prefix}-${item.url}-${index}`;
  return `${prefix}-fallback-${index}`;
}

export function normalizeMediaItems(media) {
  if (!Array.isArray(media)) return [];

  return media
    .map((item) => ({
      ...item,
      type: item?.type === "video" ? "video" : "image",
      url: typeof item?.url === "string" ? item.url.trim() : "",
    }))
    .filter((item) => item.url);
}

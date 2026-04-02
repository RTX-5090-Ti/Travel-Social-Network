export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function createCroppedAvatar(
  src,
  crop,
  naturalSize,
  { viewportSize = 440, outputSize = 512 } = {},
) {
  const image = await loadImage(src);

  const width = naturalSize?.width || image.naturalWidth;
  const height = naturalSize?.height || image.naturalHeight;

  const baseScale = Math.max(viewportSize / width, viewportSize / height);
  const scale = baseScale * crop.zoom;

  const drawWidth = width * scale;
  const drawHeight = height * scale;

  const maxOffsetX = Math.max(0, (drawWidth - viewportSize) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - viewportSize) / 2);

  const safeX = Math.min(maxOffsetX, Math.max(-maxOffsetX, crop.x));
  const safeY = Math.min(maxOffsetY, Math.max(-maxOffsetY, crop.y));

  const offsetX = (viewportSize - drawWidth) / 2 + safeX;
  const offsetY = (viewportSize - drawHeight) / 2 + safeY;

  const ratio = outputSize / viewportSize;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "#f6f7ff";
  ctx.fillRect(0, 0, outputSize, outputSize);

  ctx.drawImage(
    image,
    offsetX * ratio,
    offsetY * ratio,
    drawWidth * ratio,
    drawHeight * ratio,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không crop được ảnh."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

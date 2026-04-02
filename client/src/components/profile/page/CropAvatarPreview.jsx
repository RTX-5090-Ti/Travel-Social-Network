import { useEffect, useState } from "react";
import { loadImage } from "./profileAvatar.utils";

export default function CropAvatarPreview({ src, crop, onLoadedSize }) {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let ignore = false;

    loadImage(src)
      .then((img) => {
        if (ignore) return;
        setNaturalSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        onLoadedSize?.({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [src, onLoadedSize]);

  if (!naturalSize.width || !naturalSize.height) {
    return null;
  }

  const viewportSize = 440;
  const baseScale = Math.max(
    viewportSize / naturalSize.width,
    viewportSize / naturalSize.height,
  );

  const scale = baseScale * crop.zoom;
  const drawWidth = naturalSize.width * scale;
  const drawHeight = naturalSize.height * scale;

  return (
    <img
      src={src}
      alt="Avatar crop preview"
      draggable={false}
      className="absolute pointer-events-none select-none left-1/2 top-1/2 max-w-none"
      style={{
        width: `${drawWidth}px`,
        height: `${drawHeight}px`,
        transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`,
      }}
    />
  );
}

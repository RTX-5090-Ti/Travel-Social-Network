import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function PreviewMediaSlide({
  item,
  tripTitle,
  isActive,
  isPrevious,
  shouldPlay,
  animateProps,
  transitionProps,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (item?.type !== "video") return;

    const node = videoRef.current;
    if (!node) return;

    if (isActive && shouldPlay) {
      const playPromise = node.play();
      if (playPromise?.catch) playPromise.catch(() => {});
      return;
    }

    node.pause();
    node.currentTime = 0;
  }, [item?.type, isActive, shouldPlay]);

  const commonProps = {
    initial: false,
    animate: animateProps,
    transition: transitionProps,
    className: "absolute inset-0 h-full w-full object-cover",
    style: {
      zIndex: isActive ? 2 : isPrevious ? 1 : 0,
      pointerEvents: "none",
      willChange: isActive || isPrevious ? "transform, opacity" : "auto",
    },
  };

  if (item?.type === "video") {
    return (
      <motion.video
        {...commonProps}
        ref={videoRef}
        src={item.url}
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  return <motion.img {...commonProps} src={item.url} alt={tripTitle} />;
}

// Hiệu ứng hạt sáng nhỏ khi focus input
import { motion } from "framer-motion";

export default function Sparkles({ items }) {
  return (
    <>
      {items.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: sparkle.x,
            y: sparkle.y,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
            delay: sparkle.delay,
          }}
          className="absolute z-20 w-1 h-1 bg-indigo-500 rounded-full pointer-events-none"
          style={{ top: sparkle.top, left: sparkle.left }}
        />
      ))}
    </>
  );
}

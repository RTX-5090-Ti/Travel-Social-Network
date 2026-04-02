import { motion } from "framer-motion";

export default function ProfileHeroStatCard({ label, value, icon: Icon }) {
  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.02,
        rotateX: 5,
        rotateY: -5,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 18,
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
      className="group relative min-w-[120px] overflow-hidden rounded-[24px] border border-white/45 bg-white/10 px-4 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.10)] ring-1 ring-white/18 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.20),rgba(255,255,255,0.08),rgba(255,255,255,0.10))]" />

      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(167,139,250,0.12),transparent_30%)] opacity-90" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]" />

      <motion.div
        className="absolute w-24 h-24 rounded-full pointer-events-none -left-8 -top-8 bg-white/12 blur-2xl"
        whileHover={{ scale: 1.18, x: 8, y: 8 }}
        transition={{ duration: 0.35 }}
      />

      <motion.div
        className="absolute w-24 h-24 rounded-full pointer-events-none -bottom-10 -right-8 bg-violet-200/14 blur-2xl"
        whileHover={{ scale: 1.16, x: -8, y: -6 }}
        transition={{ duration: 0.35 }}
      />

      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-3">
          <motion.p
            className="text-[13px] font-medium text-zinc-700/90"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
            style={{ transform: "translateZ(16px)" }}
          >
            {label}
          </motion.p>

          <motion.div
            whileHover={{
              scale: 1.06,
              rotate: -8,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 16 }}
            style={{ transform: "translateZ(22px)" }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-violet-200/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(243,238,255,0.42),rgba(235,244,255,0.34))] text-[#6c5ce7] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_20px_rgba(109,93,252,0.10)] p-2"
          >
            <Icon className="h-[18px] w-[18px]" />
          </motion.div>
        </div>

        <motion.p
          className="mt-5 text-[28px] font-semibold tracking-tight text-zinc-800"
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
          style={{ transform: "translateZ(26px)" }}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}

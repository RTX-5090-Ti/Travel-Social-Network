import { motion } from "framer-motion";

export default function ProfileTabButton({
  active,
  onClick,
  icon: Icon,
  label,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex min-w-[88px] items-center justify-center rounded-[12px] px-3 py-2 text-[12px] font-semibold transition cursor-pointer sm:min-w-[108px] sm:rounded-[14px] sm:px-4 sm:py-2.5 sm:text-[13px]"
    >
      {active ? (
        <motion.span
          layoutId="profile-tab-pill"
          className="absolute inset-0 rounded-[12px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] shadow-[0_10px_20px_rgba(102,126,234,0.26)] sm:rounded-[14px]"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
        />
      ) : null}

      <span
        className={`relative z-[1] inline-flex items-center gap-1.5 transition sm:gap-2 ${
          active ? "text-white" : "text-zinc-500 group-hover:text-zinc-900"
        }`}
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>{label}</span>
      </span>
    </button>
  );
}

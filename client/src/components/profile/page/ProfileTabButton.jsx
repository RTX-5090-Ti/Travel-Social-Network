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
      className="group relative inline-flex min-w-[108px] items-center justify-center rounded-[14px] px-4 py-2.5 text-[13px] font-semibold transition cursor-pointer"
    >
      {active ? (
        <motion.span
          layoutId="profile-tab-pill"
          className="absolute inset-0 rounded-[14px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] shadow-[0_10px_20px_rgba(102,126,234,0.26)]"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
        />
      ) : null}

      <span
        className={`relative z-[1] inline-flex items-center gap-2 transition ${
          active ? "text-white" : "text-zinc-500 group-hover:text-zinc-900"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </span>
    </button>
  );
}

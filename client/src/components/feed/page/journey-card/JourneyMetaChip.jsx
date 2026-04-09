export default function JourneyMetaChip({ text, tone = "soft", icon = null }) {
  const styles = {
    soft: "border border-zinc-200 bg-zinc-50 text-zinc-600",
    blue: "border border-blue-100 bg-blue-50/95 text-[#4f7cff]",
    white: "border border-white/70 bg-white/85 text-zinc-700 backdrop-blur",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${styles[tone] || styles.soft}`}
    >
      {icon ? <span className="mr-1.5">{icon}</span> : null}
      {text}
    </span>
  );
}

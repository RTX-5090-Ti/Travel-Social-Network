export default function ProfileMetaPill({ icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-full shadow-sm border-white/70 bg-white/75 backdrop-blur">
      <span className="text-zinc-500">{icon}</span>
      <span className="text-[13px] font-medium text-zinc-600">{text}</span>
    </div>
  );
}

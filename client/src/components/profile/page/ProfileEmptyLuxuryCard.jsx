import { ImageIcon, Plus } from "lucide-react";

export default function ProfileEmptyLuxuryCard({ onShareJourney }) {
  return (
    <div className="mt-5 rounded-[26px] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] px-5 py-10 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16))] text-violet-600">
        <ImageIcon className="w-6 h-6" />
      </div>

      <h4 className="mt-4 text-[18px] font-semibold text-zinc-900">
        Chưa có journey nổi bật nào
      </h4>

      <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-7 text-zinc-500">
        Sau khi bạn chia sẻ những journey đầu tiên, các hành trình nổi bật sẽ
        xuất hiện tại đây.
      </p>

      <button
        type="button"
        onClick={onShareJourney}
        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5"
      >
        <Plus className="w-4 h-4" />
        Share journey
      </button>
    </div>
  );
}

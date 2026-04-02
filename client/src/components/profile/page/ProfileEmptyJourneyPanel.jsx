import { Compass, Plus } from "lucide-react";

export default function ProfileEmptyJourneyPanel({ onShareJourney }) {
  return (
    <div className="rounded-[30px] border border-dashed border-zinc-200 bg-[linear-gradient(180deg,#ffffff,#fbfbff)] px-5 py-12 text-center shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.16))] text-violet-600">
        <Compass className="h-7 w-7" />
      </div>

      <h4 className="mt-5 text-[22px] font-semibold tracking-tight text-zinc-900">
        Chưa có journey nào trên trang cá nhân
      </h4>

      <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-zinc-500">
        UI này đã sẵn chỗ để mày show toàn bộ bài của chính mình. Chỉ cần đăng
        trip đầu tiên là profile nhìn ra chất sản phẩm ngay.
      </p>

      <button
        type="button"
        onClick={onShareJourney}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.28)] transition hover:-translate-y-0.5"
      >
        <Plus className="w-4 h-4" />
        Share your first journey
      </button>
    </div>
  );
}

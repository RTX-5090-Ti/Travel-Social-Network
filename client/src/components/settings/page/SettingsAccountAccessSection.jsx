import { Trash2, UserX } from "lucide-react";
import SettingsAccordion from "./SettingsAccordion";

export default function SettingsAccountAccessSection({
  open,
  onToggle,
  onOpenDeactivateModal,
  onOpenDeleteModal,
}) {
  return (
    <SettingsAccordion
      title="Account access"
      description="Deactivate your account temporarily or delete it permanently."
      icon={UserX}
      open={open}
      onToggle={onToggle}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-amber-100 bg-[linear-gradient(180deg,#fffdf6,#fff7e6)] p-5 shadow-[0_12px_28px_rgba(245,158,11,0.07)]">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600">
            <UserX className="h-5 w-5" />
          </div>
          <h4 className="mt-4 text-[18px] font-semibold tracking-tight text-zinc-900">
            Deactivate account
          </h4>
          <p className="mt-2 text-[14px] leading-7 text-zinc-500">
            Temporarily hide your account until you are ready to come back.
          </p>
          <button
            type="button"
            onClick={onOpenDeactivateModal}
            className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            Deactivate
          </button>
        </div>

        <div className="rounded-[24px] border border-rose-100 bg-[linear-gradient(180deg,#fff8fa,#fff0f3)] p-5 shadow-[0_12px_28px_rgba(244,63,94,0.07)]">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <h4 className="mt-4 text-[18px] font-semibold tracking-tight text-zinc-900">
            Delete account
          </h4>
          <p className="mt-2 text-[14px] leading-7 text-zinc-500">
            Permanently remove your account and all associated data.
          </p>
          <button
            type="button"
            onClick={onOpenDeleteModal}
            className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185_0%,#f43f5e_100%)] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,63,94,0.18)] transition hover:-translate-y-0.5"
          >
            Delete account
          </button>
        </div>
      </div>
    </SettingsAccordion>
  );
}

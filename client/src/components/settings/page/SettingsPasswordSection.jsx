import { Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import SettingsAccordion from "./SettingsAccordion";

export default function SettingsPasswordSection({
  open,
  onToggle,
  isPasswordFormOpen,
  onOpenPasswordForm,
  passwordForm,
  passwordErrors,
  passwordShow,
  isConfirmMatched,
  isPasswordSaving,
  onPasswordInputChange,
  onTogglePasswordVisibility,
  onCancelPasswordForm,
  onSavePassword,
}) {
  return (
    <SettingsAccordion
      title="Change password"
      description="Update your password to keep your account secure."
      icon={LockKeyhole}
      open={open}
      onToggle={onToggle}
    >
      <div className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,255,0.95))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] ring-1 ring-zinc-200/55">
        <p className="text-[14px] leading-7 text-zinc-500">
          You can change your password here whenever you want.
        </p>

        {!isPasswordFormOpen ? (
          <button
            type="button"
            onClick={onOpenPasswordForm}
            className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5"
          >
            Change password
          </button>
        ) : (
          <div className="mt-5 rounded-[24px] border border-zinc-200/80 bg-white/90 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="grid gap-3">
              <PasswordField
                label="Current password"
                value={passwordForm.currentPassword}
                error={passwordErrors.currentPassword}
                visible={passwordShow.currentPassword}
                onChange={(value) =>
                  onPasswordInputChange("currentPassword", value)
                }
                onToggleVisibility={() =>
                  onTogglePasswordVisibility("currentPassword")
                }
                placeholder="Enter current password"
              />

              <PasswordField
                label="New password"
                value={passwordForm.newPassword}
                error={passwordErrors.newPassword}
                visible={passwordShow.newPassword}
                onChange={(value) => onPasswordInputChange("newPassword", value)}
                onToggleVisibility={() =>
                  onTogglePasswordVisibility("newPassword")
                }
                placeholder="Enter new password"
              />

              <PasswordField
                label="Confirm password"
                value={passwordForm.confirmPassword}
                error={passwordErrors.confirmPassword}
                visible={passwordShow.confirmPassword}
                onChange={(value) =>
                  onPasswordInputChange("confirmPassword", value)
                }
                onToggleVisibility={() =>
                  onTogglePasswordVisibility("confirmPassword")
                }
                placeholder="Confirm new password"
                showMatchedCheck={isConfirmMatched}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancelPasswordForm}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSavePassword}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(102,126,234,0.24)] transition hover:-translate-y-0.5"
              >
                {isPasswordSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </SettingsAccordion>
  );
}

function PasswordField({
  label,
  value,
  error,
  visible,
  onChange,
  onToggleVisibility,
  placeholder,
  showMatchedCheck = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-zinc-700">
        {label}
      </span>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-[18px] border bg-[linear-gradient(180deg,#ffffff,#f7f8fc)] px-4 text-[14px] text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:ring-2 ${
            showMatchedCheck ? "pr-20" : "pr-12"
          } ${
            error
              ? "border-red-300 focus:border-red-300 focus:ring-red-100"
              : "border-zinc-200/80 focus:border-violet-200 focus:ring-violet-100"
          }`}
        />

        <div className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-2">
          {showMatchedCheck ? (
            <span
              className={`inline-flex items-center justify-center ${
                showMatchedCheck ? "text-emerald-500" : "text-transparent"
              }`}
            >
              <Check className="h-4.5 w-4.5" />
            </span>
          ) : null}

          <button
            type="button"
            onClick={onToggleVisibility}
            className="inline-flex cursor-pointer items-center justify-center text-zinc-400 transition hover:text-zinc-700"
          >
            {visible ? (
              <EyeOff className="h-4.5 w-4.5" />
            ) : (
              <Eye className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-[12px] font-medium text-red-500">{error}</p>
      ) : null}
    </label>
  );
}

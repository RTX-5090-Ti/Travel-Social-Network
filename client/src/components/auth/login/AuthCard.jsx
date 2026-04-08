import { motion } from "framer-motion";
import { Check } from "lucide-react";
import AuthInput from "./AuthInput";

function SocialIconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function SocialIconGoogle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function RememberCheckbox({ checked, onChange }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 active:scale-[0.98] transition-transform duration-150">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="hidden peer"
      />

      <div
        className={`relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md border-2 bg-white/90 transition-all duration-500 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] ${
          checked
            ? "rotate-[360deg] scale-110 border-transparent shadow-[0_0_12px_rgba(99,102,241,0.35)]"
            : "border-slate-300"
        }`}
      >
        <div
          className={`absolute inset-0 bg-[linear-gradient(90deg,#ff6b6b,#4ecdc4,#45b7d1)] transition-transform duration-500 ${
            checked ? "translate-x-0" : "-translate-x-full"
          }`}
        />
        <Check
          className={`relative z-10 h-3.5 w-3.5 text-white transition-all duration-300 ${
            checked ? "scale-100 rotate-0" : "scale-0 rotate-[-120deg]"
          }`}
        />
      </div>

      <span className="text-sm transition-colors duration-300 text-slate-600 group-hover:text-indigo-500">
        Remember me
      </span>
    </label>
  );
}

function SocialLoginSection({ loading, onSocialLogin }) {
  return (
    <>
      <div className="my-6 flex items-center gap-3 sm:my-8 sm:gap-4">
        <div className="relative flex-1 h-px overflow-hidden bg-slate-300/70">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          />
        </div>
        <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.18em]">
          OR CONTINUE WITH
        </span>
        <div className="relative flex-1 h-px overflow-hidden bg-slate-300/70">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <button
          type="button"
          onClick={() => onSocialLogin("Facebook")}
          disabled={loading}
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-[14px] text-slate-700 transition hover:-translate-y-0.5 hover:scale-[1.05] hover:bg-white hover:shadow-lg disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          <span className="absolute inset-0 left-[-100%] bg-[linear-gradient(135deg,currentColor,transparent)] opacity-10 transition-all duration-500 group-hover:left-0" />
          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877f2]/10 text-[#1877f2]">
            <SocialIconFacebook />
          </div>
          <span className="relative z-10 font-medium">Facebook</span>
        </button>

        <button
          type="button"
          onClick={() => onSocialLogin("Google")}
          disabled={loading}
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-[14px] text-slate-700 transition hover:-translate-y-0.5 hover:scale-[1.05] hover:bg-white hover:shadow-lg disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          <span className="absolute inset-0 left-[-100%] bg-[linear-gradient(135deg,currentColor,transparent)] opacity-10 transition-all duration-500 group-hover:left-0" />
          <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500">
            <SocialIconGoogle />
          </div>
          <span className="relative z-10 font-medium">Google</span>
        </button>
      </div>
    </>
  );
}

export default function AuthCard({
  mode,
  setMode,
  loading,
  success,
  remember,
  setRemember,
  form,
  errors,
  focusedFields,
  sparkles,
  showPassword,
  onFieldChange,
  onFieldFocus,
  onFieldBlur,
  onTogglePassword,
  onSubmit,
  onSocialLogin,
}) {
  const commonProps = (field) => ({
    value: form[field],
    error: errors[field],
    focused: focusedFields[field],
    sparkleItems: sparkles[field],
    onChange: (e) => onFieldChange(field, e.target.value),
    onFocus: () => onFieldFocus(field),
    onBlur: () => onFieldBlur(field),
  });

  return success ? (
    <div className="py-10 text-center">
      <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full shadow-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 12,
          }}
          className="flex items-center justify-center w-16 h-16 bg-white rounded-full text-emerald-500"
        >
          <Check className="w-8 h-8" />
        </motion.div>
      </div>

      <h3 className="mb-2 text-2xl font-bold text-slate-800">
        {mode === "login" ? "Welcome, Creator!" : "Account created!"}
      </h3>
      <p className="text-slate-500">
        {mode === "login"
          ? "Entering your creative dimension..."
          : "Your account is ready. Let's start the journey!"}
      </p>
    </div>
  ) : (
    <>
      <div className="mb-7 text-center sm:mb-10">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center sm:mb-6 sm:h-20 sm:w-20">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute h-[60px] w-[60px] rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53]"
          />
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
              delay: -5,
            }}
            className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-[#4ecdc4] to-[#44a08d]"
          />
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
              delay: -10,
            }}
            className="absolute h-5 w-5 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe]"
          />
        </div>

        <h2 className="mb-2 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] bg-clip-text text-[1.9rem] font-bold text-transparent sm:text-[2.25rem]">
          {mode === "login" ? "Welcome" : "Create account"}
        </h2>
        <p className="text-[14px] italic leading-6 text-slate-500 sm:text-base">
          {mode === "login"
            ? "Sign in to continue your journey"
            : "Create your account to start your journey"}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5 sm:space-y-7">
        {mode === "login" ? (
          <>
            <AuthInput
              field="loginEmail"
              label="Email Address"
              type="email"
              autoComplete="email"
              {...commonProps("loginEmail")}
            />

            <AuthInput
              field="loginPassword"
              label="Password"
              type="password"
              autoComplete="current-password"
              passwordVisible={showPassword.loginPassword}
              onTogglePassword={() => onTogglePassword("loginPassword")}
              {...commonProps("loginPassword")}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <RememberCheckbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />

              <button
                type="button"
                className="group relative text-sm font-medium italic text-indigo-500 transition hover:-translate-y-0.5 hover:text-violet-600 cursor-pointer"
              >
                Forgot password?
                <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-[linear-gradient(90deg,#ff6b6b,#4ecdc4)] transition-all duration-300 group-hover:w-full" />
              </button>
            </div>
          </>
        ) : (
          <>
            <AuthInput
              field="fullName"
              label="Full Name"
              type="text"
              autoComplete="name"
              {...commonProps("fullName")}
            />

            <AuthInput
              field="registerEmail"
              label="Email Address"
              type="email"
              autoComplete="email"
              {...commonProps("registerEmail")}
            />

            <AuthInput
              field="registerPassword"
              label="Password"
              type="password"
              autoComplete="new-password"
              passwordVisible={showPassword.registerPassword}
              onTogglePassword={() => onTogglePassword("registerPassword")}
              {...commonProps("registerPassword")}
            />

            <AuthInput
              field="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              passwordVisible={showPassword.confirmPassword}
              onTogglePassword={() => onTogglePassword("confirmPassword")}
              {...commonProps("confirmPassword")}
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_8px_25px_rgba(102,126,234,0.4)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_15px_40px_rgba(102,126,234,0.6)] disabled:cursor-not-allowed disabled:opacity-80 cursor-pointer"
        >
          <span className="absolute inset-y-0 left-[-100%] w-full bg-[linear-gradient(135deg,#ff6b6b,#4ecdc4,#45b7d1,#6c5ce7)] bg-[length:300%_100%] transition-all duration-500 group-hover:left-0" />

          {!loading ? (
            <span className="relative z-10 text-sm font-semibold tracking-[0.18em] uppercase">
              {mode === "login" ? "Sign In" : "Create Account"}
            </span>
          ) : (
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.2s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white [animation-delay:-0.1s]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white" />
            </span>
          )}
        </button>
      </form>

      {mode === "login" && (
        <SocialLoginSection loading={loading} onSocialLogin={onSocialLogin} />
      )}

      <div className="mt-6 text-center text-[13px] text-slate-500 sm:mt-8 sm:text-sm">
        {mode === "login" ? (
          <p>
            New to our platform?{" "}
            <button
              type="button"
              onClick={() => setMode("register")}
              className="font-semibold text-indigo-500 transition cursor-pointer group hover:text-violet-600"
            >
              Create account
              <span className="ml-1 inline-block translate-x-[-10px] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                ✨
              </span>
            </button>
          </p>
        ) : (
          <p>
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-semibold text-indigo-500 transition cursor-pointer group hover:text-violet-600"
            >
              Quay về đăng nhập
              <span className="ml-1 inline-block translate-x-[-10px] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"></span>
            </button>
          </p>
        )}
      </div>
    </>
  );
}

// Các hiệu ứng input đẹp/animation/sparkle/password show/hide/error UI
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Sparkles from "./Sparkles";

const inputBase =
  "peer w-full rounded-xl border-2 bg-white/90 px-5 pb-2 pt-5 text-[16px] text-slate-800 outline-none transition-all duration-300 placeholder-transparent backdrop-blur-md";
const inputState =
  "border-white/30 focus:-translate-y-0.5 focus:border-transparent focus:bg-white focus:shadow-[0_10px_30px_rgba(102,126,234,0.20)]";
const labelBase =
  "pointer-events-none absolute left-5 top-5 origin-left rounded bg-white/90 px-2 text-[16px] font-medium text-slate-500 transition-all duration-300";
const floatedLabelClass =
  "-translate-y-9 translate-x-2 scale-[0.85] font-semibold text-indigo-500";

export default function AuthInput({
  field,
  label,
  type = "text",
  value,
  error,
  focused,
  sparkleItems,
  onChange,
  onFocus,
  onBlur,
  autoComplete,
  options = [],
  passwordVisible = false,
  onTogglePassword,
}) {
  const floated = focused || Boolean(value);
  const isPassword = type === "password";
  const inputType = isPassword ? (passwordVisible ? "text" : "password") : type;

  return (
    <div>
      <div className="relative flex flex-col">
        <Sparkles items={sparkleItems} />

        {/* <motion.div
          initial={false}
          animate={{
            opacity: focused ? 1 : 0,
            backgroundPosition: focused
              ? ["0% 50%", "100% 50%", "0% 50%"]
              : "0% 50%",
          }}
          transition={{
            opacity: { duration: 0.3 },
            backgroundPosition: {
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-[linear-gradient(90deg,#ff6b6b,#4ecdc4,#45b7d1,#6c5ce7)] bg-[length:300%_100%]"
        /> */}

        {type === "select" ? (
          <select
            id={field}
            name={field}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            className={`${inputBase} ${inputState} appearance-none ${
              error
                ? "border-red-400 bg-red-50/70 [animation:shake_0.5s_ease-in-out]"
                : ""
            }`}
          >
            <option value="">Chọn</option>
            {options.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            id={field}
            name={field}
            required
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            className={`${inputBase} ${inputState} ${
              isPassword ? "pr-14" : ""
            } ${
              error
                ? "border-red-400 bg-red-50/70 [animation:shake_0.5s_ease-in-out]"
                : ""
            }`}
            placeholder={label}
          />
        )}

        <label
          htmlFor={field}
          className={`${labelBase} ${floated ? floatedLabelClass : ""}`}
        >
          {label}
        </label>

        {isPassword && onTogglePassword && (
          <motion.button
            type="button"
            aria-label="Toggle password visibility"
            onClick={onTogglePassword}
            whileTap={{ scale: 1.2 }}
            className="absolute z-10 p-2 transition -translate-y-1/2 rounded-lg right-5 top-1/2 text-slate-500 hover:scale-110 hover:bg-indigo-500/10 hover:text-indigo-500"
          >
            {passwordVisible ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </motion.button>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-xl">
          {focused && (
            <>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#ff6b6b] to-transparent"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.1,
                }}
                className="absolute bottom-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#4ecdc4] to-transparent"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
                className="absolute bottom-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#45b7d1] to-transparent"
              />
            </>
          )}
        </div>
      </div>

      <p
        className={`ml-2 mt-2 rounded-lg border-l-4 border-red-500 bg-red-500/10 px-3 py-1.5 text-sm text-red-500 transition-all duration-300 ${
          error ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        {error || "\u00A0"}
      </p>
    </div>
  );
}

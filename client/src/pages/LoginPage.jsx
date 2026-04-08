import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AuthCard from "../components/auth/login/AuthCard";
import FloatingShape from "../components/auth/login/FloatingShape";
import SlidePlaceholder from "../components/auth/login/SlidePlaceholder";
import { useToast } from "../toast/useToast";
import {
  DISPLAY_DURATION,
  TRANSITION_DURATION,
  initialErrors,
  initialFocusedFields,
  initialForm,
  initialShowPassword,
  initialSparkles,
  slides,
} from "../components/auth/login/constants";

export default function LoginPage() {
  const nav = useNavigate();
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(initialShowPassword);
  const [focusedFields, setFocusedFields] = useState(initialFocusedFields);
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [cardHovered, setCardHovered] = useState(false);
  const [sparkles, setSparkles] = useState(initialSparkles);
  const cardRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [currentSlide]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const shapeStyles = useMemo(() => {
    return slides.map((_, index) => {
      const speed = (index + 1) * 0.5;
      const x = (mouse.x - 0.5) * speed * 20;
      const y = (mouse.y - 0.5) * speed * 20;

      return {
        transform: `translate(${x}px, ${y}px)`,
      };
    });
  }, [mouse]);

  const createSparkles = (field) => {
    const batch = Array.from({ length: 5 }, (_, index) => ({
      id: `${field}-${Date.now()}-${index}`,
      top: `${18 + Math.random() * 64}%`,
      left: `${8 + Math.random() * 84}%`,
      x: (Math.random() - 0.5) * 30,
      y: -20 - Math.random() * 25,
      delay: index * 0.08,
    }));

    setSparkles((prev) => ({
      ...prev,
      [field]: [...prev[field], ...batch],
    }));

    setTimeout(() => {
      setSparkles((prev) => ({
        ...prev,
        [field]: prev[field].filter(
          (sparkle) => !batch.some((item) => item.id === sparkle.id),
        ),
      }));
    }, 1000);
  };

  const handleCardMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    setCardTilt({
      rotateX: (mouseY / rect.height) * -10,
      rotateY: (mouseX / rect.width) * 10,
    });
  };

  const resetCardTilt = () => {
    setCardHovered(false);
    setCardTilt({ rotateX: 0, rotateY: 0 });
  };

  const validateField = (field) => {
    const value = form[field]?.trim?.() ?? form[field];
    let message = "";

    switch (field) {
      case "loginEmail":
      case "registerEmail": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value) {
          message = "Email là bắt buộc";
        } else if (!emailRegex.test(value)) {
          message = "Email không đúng định dạng";
        }
        break;
      }

      case "loginPassword":
      case "registerPassword":
        if (!value) {
          message = "Password là bắt buộc";
        } else if (value.length < 6) {
          message = "Password phải có ít nhất 6 ký tự";
        }
        break;

      case "fullName":
        if (!value) {
          message = "Tên là bắt buộc";
        }
        break;

      case "confirmPassword":
        if (!value) {
          message = "Confirm password là bắt buộc";
        } else if (value !== form.registerPassword) {
          message = "Mật khẩu nhập lại không khớp";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));

    return !message;
  };

  const validateCurrentForm = () => {
    const fields =
      mode === "login"
        ? ["loginEmail", "loginPassword"]
        : ["fullName", "registerEmail", "registerPassword", "confirmPassword"];

    return fields.map(validateField).every(Boolean);
  };

  const triggerFailure = () => {
    setShakeCard(true);
    setTimeout(() => setShakeCard(false), 500);
  };

  const resetUiState = () => {
    setSuccess(false);
    setLoading(false);
    setShakeCard(false);
    setErrors(initialErrors);
    setFocusedFields(initialFocusedFields);
    setShowPassword(initialShowPassword);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetUiState();
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (field === "registerPassword" && errors.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "",
      }));
    }
  };

  const handleFieldFocus = (field) => {
    setFocusedFields((prev) => ({
      ...prev,
      [field]: true,
    }));
    createSparkles(field);
  };

  const handleFieldBlur = (field) => {
    setFocusedFields((prev) => ({
      ...prev,
      [field]: false,
    }));
    validateField(field);
  };

  const handleTogglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = validateCurrentForm();
    if (!ok) {
      triggerFailure();
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login({
          email: form.loginEmail,
          password: form.loginPassword,
        });

        showToast("Đăng nhập thành công", "success");
      } else {
        await register({
          name: form.fullName,
          email: form.registerEmail,
          password: form.registerPassword,
        });

        showToast("Tạo tài khoản thành công", "success");
      }

      setSuccess(true);

      setTimeout(() => {
        nav("/");
      }, 800);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (mode === "login"
          ? "Đăng nhập thất bại"
          : "Đăng ký tài khoản thất bại");

      setErrors(initialErrors);

      if (mode === "login") {
        setErrors((prev) => ({
          ...prev,
          loginEmail: message,
          loginPassword: message,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          registerEmail: message,
          registerPassword: message,
        }));
      }

      triggerFailure();
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (platform) => {
    showToast(`Đăng nhập bằng ${platform} sẽ được cập nhật sau.`, "warning");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans md:bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] md:px-5 md:py-6 lg:px-6 lg:py-8">
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <FloatingShape
          className="left-[10%] top-[8%] h-16 w-16 sm:h-20 sm:w-20"
          style={shapeStyles[0]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(255,107,107,0.3),rgba(255,142,83,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="right-[10%] top-[16%] h-[90px] w-[90px] sm:right-[15%] sm:top-[20%] sm:h-[120px] sm:w-[120px]"
          style={shapeStyles[1]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(72,187,120,0.3),rgba(56,178,172,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="bottom-[30%] left-[20%] h-[60px] w-[60px]"
          style={shapeStyles[2]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="bottom-[12%] right-[4%] h-[76px] w-[76px] sm:bottom-[10%] sm:right-[10%] sm:h-[100px] sm:w-[100px]"
          style={shapeStyles[3]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(236,72,153,0.3),rgba(219,39,119,0.3))]" />
        </FloatingShape>

        <FloatingShape
          className="left-[-4%] top-[48%] h-[96px] w-[96px] sm:left-[5%] sm:top-1/2 sm:h-[140px] sm:w-[140px]"
          style={shapeStyles[4]}
        >
          <div className="h-full w-full rounded-full bg-[linear-gradient(45deg,rgba(251,191,36,0.3),rgba(245,158,11,0.3))]" />
        </FloatingShape>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] items-start justify-center md:min-h-[calc(100vh-48px)] md:items-center">
        <div className="grid w-full grid-cols-1 items-start lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10">
          <div className="items-center justify-center hidden lg:flex">
            <div className="flex w-full max-w-[980px] flex-col">
              <div className="flex gap-2 px-2 mb-5">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"
                  >
                    {index < currentSlide && (
                      <div className="absolute inset-0 bg-white rounded-full" />
                    )}

                    {index === currentSlide && (
                      <motion.div
                        key={`progress-${currentSlide}`}
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: DISPLAY_DURATION / 1000,
                          ease: "linear",
                        }}
                        className="absolute top-0 left-0 h-full bg-white rounded-full"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="relative h-[820px] overflow-hidden rounded-[40px] border border-white/20 bg-white/5 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                <div className="relative h-full w-full overflow-hidden rounded-[32px]">
                  <AnimatePresence mode="sync">
                    <motion.div
                      key={currentSlide}
                      initial={{ x: "100%", opacity: 0.9 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: "-100%", opacity: 0.9 }}
                      transition={{
                        duration: TRANSITION_DURATION,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute inset-0"
                    >
                      <SlidePlaceholder index={currentSlide} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-screen items-start justify-center md:min-h-0 md:items-center">
            <motion.div
              ref={cardRef}
              onMouseEnter={() => setCardHovered(true)}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={resetCardTilt}
              animate={{
                x: shakeCard ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
                rotateX: cardTilt.rotateX,
                rotateY: cardTilt.rotateY,
                y: cardHovered && !shakeCard ? -8 : 0,
                scale: cardHovered && !shakeCard ? 1.02 : 1,
              }}
              transition={{
                x: { duration: 0.45 },
                rotateX: { type: "spring", stiffness: 180, damping: 18 },
                rotateY: { type: "spring", stiffness: 180, damping: 18 },
                y: { duration: 0.25 },
                scale: { duration: 0.25 },
              }}
              style={{ transformStyle: "preserve-3d" }}
              className={`relative min-h-screen w-full max-w-none overflow-hidden border-0 bg-white p-5 transition-shadow duration-500 sm:p-8 md:min-h-0 md:max-w-[450px] md:rounded-[24px] md:border md:border-white/30 md:bg-white/95 md:p-10 md:backdrop-blur-[20px] ${
                shakeCard
                  ? "shadow-none md:shadow-[0_25px_50px_rgba(229,62,62,0.30),0_0_0_1px_rgba(229,62,62,0.2)]"
                  : cardHovered
                    ? "shadow-none md:shadow-[0_35px_70px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.2)]"
                    : "shadow-none md:shadow-[0_25px_50px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)]"
              }`}
            >
              <div className="absolute inset-x-0 top-0 hidden h-[6px] overflow-hidden md:block">
                <motion.div
                  className="absolute top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#ff6b6b] to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute top-[2px] h-[2px] w-full bg-gradient-to-r from-transparent via-[#4ecdc4] to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: -2,
                  }}
                />
                <motion.div
                  className="absolute top-[4px] h-[2px] w-full bg-gradient-to-r from-transparent via-[#45b7d1] to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: -4,
                  }}
                />
              </div>

              <AuthCard
                mode={mode}
                setMode={switchMode}
                loading={loading}
                success={success}
                remember={remember}
                setRemember={setRemember}
                form={form}
                errors={errors}
                focusedFields={focusedFields}
                sparkles={sparkles}
                showPassword={showPassword}
                onFieldChange={handleFieldChange}
                onFieldFocus={handleFieldFocus}
                onFieldBlur={handleFieldBlur}
                onTogglePassword={handleTogglePassword}
                onSubmit={handleSubmit}
                onSocialLogin={handleSocialLogin}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

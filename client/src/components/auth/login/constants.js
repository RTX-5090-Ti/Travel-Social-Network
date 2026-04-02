// Chưa class dùng chung: inputBase/inputState/labelBase/Hằng animation/class
export const DISPLAY_DURATION = 5000;
export const TRANSITION_DURATION = 0.8;

export const slides = [
  "/images/Gemini_Generated_Image_vf0weovf0weovf0w.png",
  "/images/1.jpeg",
  "/images/3.webp",
  "/images/4.avif",
  "/images/5.avif",
];

export const initialForm = {
  loginEmail: "",
  loginPassword: "",
  fullName: "",
  registerEmail: "",
  registerPassword: "",
  confirmPassword: "",
};

export const initialErrors = {
  loginEmail: "",
  loginPassword: "",
  fullName: "",
  registerEmail: "",
  registerPassword: "",
  confirmPassword: "",
};

export const initialFocusedFields = {
  loginEmail: false,
  loginPassword: false,
  fullName: false,
  registerEmail: false,
  registerPassword: false,
  confirmPassword: false,
};

export const initialSparkles = {
  loginEmail: [],
  loginPassword: [],
  fullName: [],
  registerEmail: [],
  registerPassword: [],
  confirmPassword: [],
};

export const initialShowPassword = {
  loginPassword: false,
  registerPassword: false,
  confirmPassword: false,
};

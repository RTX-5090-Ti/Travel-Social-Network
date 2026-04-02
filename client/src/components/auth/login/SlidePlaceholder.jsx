// Phần bên trái có slideshow / ảnh / text giới thiệu
import { slides } from "./constants";

export default function SlidePlaceholder({ index }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[32px] bg-white/10 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />

      <div className="absolute w-32 h-32 rounded-full -left-10 top-8 bg-pink-400/20 blur-3xl" />
      <div className="absolute w-40 h-40 rounded-full bottom-8 right-6 bg-cyan-400/20 blur-3xl" />
      <div className="absolute w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full left-1/2 top-1/2 bg-violet-400/10 blur-3xl" />

      <img
        src={slides[index]}
        alt="anh"
        className="h-full w-full rounded-[32px] object-cover"
      />
    </div>
  );
}

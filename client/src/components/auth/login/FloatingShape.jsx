// Mấy shape tròn bay bay ở background của page login.
export default function FloatingShape({ className, children, style }) {
  return (
    <div
      style={style}
      className={`absolute rounded-full blur-[0.5px] opacity-80 animate-pulse ${className}`}
    >
      {children}
    </div>
  );
}

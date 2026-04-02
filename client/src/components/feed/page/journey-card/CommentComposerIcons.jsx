export function CommentSmileIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8.7 14.2c.9 1.1 2 1.6 3.3 1.6s2.4-.5 3.3-1.6" />
    </svg>
  );
}

export function CommentCameraIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 8.5a2 2 0 0 1 2-2H9l1.2-1.4a1.5 1.5 0 0 1 1.1-.5h1.4a1.5 1.5 0 0 1 1.1.5L15 6.5h2.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-8Z" />
      <circle cx="12" cy="12.5" r="3.25" />
    </svg>
  );
}

export function CommentStickerIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4.5h7.8l4.7 4.7V17a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z" />
      <path d="M14.8 4.5V8a1.2 1.2 0 0 0 1.2 1.2h3.5" />
      <circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <path d="M9.4 15c.8.7 1.7 1 2.6 1 .9 0 1.8-.3 2.6-1" />
    </svg>
  );
}

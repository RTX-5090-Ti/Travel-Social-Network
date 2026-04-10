import { Suspense, lazy } from "react";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

function PickerFallback({ width = 300, height = 360 }) {
  return (
    <div
      style={{ width, height }}
      className="flex items-center justify-center bg-white"
    >
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-500" />
    </div>
  );
}

export default function LazyEmojiPicker({
  fallbackWidth = 300,
  fallbackHeight = 360,
  ...props
}) {
  return (
    <Suspense
      fallback={
        <PickerFallback width={fallbackWidth} height={fallbackHeight} />
      }
    >
      <EmojiPicker {...props} />
    </Suspense>
  );
}

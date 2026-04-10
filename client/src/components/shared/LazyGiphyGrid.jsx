import { Suspense, lazy } from "react";

const GiphyGrid = lazy(() =>
  import("@giphy/react-components").then((module) => ({
    default: module.Grid,
  })),
);

function GridFallback({ width = 300, height = 300 }) {
  return (
    <div
      style={{ width, height }}
      className="flex items-center justify-center bg-white"
    >
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-500" />
    </div>
  );
}

export default function LazyGiphyGrid({
  fallbackWidth = 300,
  fallbackHeight = 300,
  ...props
}) {
  return (
    <Suspense
      fallback={<GridFallback width={fallbackWidth} height={fallbackHeight} />}
    >
      <GiphyGrid {...props} />
    </Suspense>
  );
}

import { useContext } from "react";

import { TripOverlayContext } from "./trip-overlay-context";

export function useTripOverlay() {
  const context = useContext(TripOverlayContext);

  if (!context) {
    throw new Error("useTripOverlay must be used within TripOverlayProvider");
  }

  return context;
}

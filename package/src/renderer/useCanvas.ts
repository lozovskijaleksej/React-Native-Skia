import React, { useContext } from "react";

import type { Skia } from "../skia/types";
import type { SkiaValue } from "../values/types";

interface CanvasContext {
  Skia: Skia;
  size: SkiaValue<{ width: number; height: number }>;
}

const CanvasContext = React.createContext<CanvasContext | null>(null);

export const CanvasProvider = CanvasContext.Provider;

export const useCanvas = () => {
  const ctx = useContext(CanvasContext);
  console.warn(
    // eslint-disable-next-line max-len
    "useCanvas is deprecated. use the onSize property instead: https://shopify.github.io/react-native-skia/docs/canvas/overview"
  );
  if (!ctx) {
    throw new Error("Canvas context is not available");
  }
  return ctx;
};

// This private function will be removed once we remove the useCanvas hook and
// implement the Mask component as a node (will be faster too)
export const useSkiaPrivate = () => {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error("Canvas context is not available");
  }
  return ctx.Skia;
};

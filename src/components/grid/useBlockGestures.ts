"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

export const LONG_PRESS_MS = 500;
export const MOVE_TOLERANCE_PX = 10;

/**
 * Tap toggles, holding ≥ 500 ms without moving more than 10 px opens the detail,
 * and moving further is a scroll that triggers nothing (FR-035).
 */
export function useBlockGestures({ onTap, onLongPress }: { onTap?: () => void; onLongPress: () => void }) {
  const state = useRef({ timer: 0, x: 0, y: 0, suppressClick: false });

  const cancel = () => window.clearTimeout(state.current.timer);

  return {
    onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const s = state.current;
      cancel();
      s.x = event.clientX;
      s.y = event.clientY;
      s.suppressClick = false;
      s.timer = window.setTimeout(() => {
        s.suppressClick = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove(event: PointerEvent) {
      const s = state.current;
      if (Math.hypot(event.clientX - s.x, event.clientY - s.y) > MOVE_TOLERANCE_PX) {
        s.suppressClick = true;
        cancel();
      }
    },
    onPointerUp: cancel,
    onPointerCancel() {
      state.current.suppressClick = true;
      cancel();
    },
    onClick(event: MouseEvent) {
      if (state.current.suppressClick) {
        state.current.suppressClick = false;
        event.preventDefault();
        return;
      }
      onTap?.();
    },
    onContextMenu(event: MouseEvent) {
      event.preventDefault();
    },
  };
}

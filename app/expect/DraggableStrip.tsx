"use client";

import { useRef, useCallback, type ReactNode } from "react";

export function DraggableStrip({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({
    dragging: false,
    startX: 0,
    baseOffset: 0,
    animationPaused: false,
  });

  const getCurrentOffset = useCallback(() => {
    const el = ref.current;
    if (!el) return 0;
    const transform = getComputedStyle(el).transform;
    if (!transform || transform === "none") return 0;
    const match = transform.match(/matrix\(([^)]+)\)/);
    if (!match) return 0;
    const values = match[1].split(",").map(Number);
    return values[4] ?? 0;
  }, []);

  const getRunWidth = useCallback(() => {
    const el = ref.current;
    if (!el) return 1;
    return el.scrollWidth / 2;
  }, []);

  const wrapOffset = useCallback(
    (offset: number) => {
      const runWidth = getRunWidth();
      let wrapped = offset % runWidth;
      if (wrapped > 0) wrapped -= runWidth;
      return wrapped;
    },
    [getRunWidth],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const el = ref.current;
      if (!el) return;

      el.setPointerCapture(e.pointerId);
      el.style.animationPlayState = "paused";
      const currentOffset = getCurrentOffset();

      state.current = {
        dragging: true,
        startX: e.clientX,
        baseOffset: currentOffset,
        animationPaused: true,
      };

      el.style.animation = "none";
      el.style.transform = `translateX(${currentOffset}px)`;
      el.style.cursor = "grabbing";
    },
    [getCurrentOffset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.current.dragging) return;
      const el = ref.current;
      if (!el) return;

      const delta = e.clientX - state.current.startX;
      const newOffset = wrapOffset(state.current.baseOffset + delta);
      el.style.transform = `translateX(${newOffset}px)`;
    },
    [wrapOffset],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!state.current.dragging) return;
      const el = ref.current;
      if (!el) return;

      el.releasePointerCapture(e.pointerId);
      state.current.dragging = false;

      const currentOffset = getCurrentOffset();
      const runWidth = getRunWidth();
      const progress = Math.abs(currentOffset) / runWidth;

      el.style.cursor = "";
      el.style.transform = "";
      el.style.animation = "";
      el.style.animationPlayState = "running";
      el.style.animationDelay = `calc(var(--lap) * ${-progress})`;
    },
    [getCurrentOffset, getRunWidth],
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, cursor: "grab", touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {children}
    </div>
  );
}

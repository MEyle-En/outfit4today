"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Kleiner Tooltip für Icon-Buttons: erscheint beim Hovern (Maus) oder beim langen Drücken (Touch, ~0,4 s)
 * und verschwindet wieder von selbst. Der Button selbst bekommt zusätzlich ein aria-label.
 */
export function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(
    () => () => {
      clearTimeout(pressTimer.current);
      clearTimeout(hideTimer.current);
    },
    [],
  );

  const flash = () => {
    setShow(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShow(false), 1600);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => {
        pressTimer.current = setTimeout(flash, 400);
      }}
      onTouchEnd={() => clearTimeout(pressTimer.current)}
      onTouchMove={() => clearTimeout(pressTimer.current)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/90 px-2.5 py-1 text-xs font-medium text-white shadow-lg animate-fade-in"
        >
          {label}
        </span>
      )}
    </span>
  );
}

import { useEffect } from "react";

export function useSessionLock(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("session-locked");
    document.body.classList.add("session-locked");

    const onTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      // If the touch isn't inside an element explicitly designated for internal scrolling,
      // prevent default to kill iOS Safari elastic rubber-banding.
      if (!target?.closest(".allow-scroll") && e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.documentElement.classList.remove("session-locked");
      document.body.classList.remove("session-locked");
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [enabled]);
}

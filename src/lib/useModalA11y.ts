import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Only the topmost open modal reacts to Escape / Tab.
const modalStack: symbol[] = [];
let scrollLocks = 0;
let previousBodyOverflow = "";

function lockScroll() {
  if (scrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLocks++;
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = previousBodyOverflow;
}

/**
 * Dialog behaviour: Escape closes the topmost modal, Tab stays inside it, body scroll is locked
 * and focus returns to the previously focused element on close. Attach the returned ref to the element with role="dialog".
 */
export function useModalA11y(onClose: () => void, enabled: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const id = Symbol("modal");
    modalStack.push(id);
    lockScroll();

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    if (container && !container.contains(document.activeElement)) {
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      if (first) {
        first.focus({ preventScroll: true });
      } else {
        container.tabIndex = -1;
        container.focus({ preventScroll: true });
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== id) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab" || !container) return;
      const items: HTMLElement[] = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el: HTMLElement) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = modalStack.indexOf(id);
      if (index !== -1) modalStack.splice(index, 1);
      unlockScroll();
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [enabled]);

  return containerRef;
}

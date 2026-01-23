import { useEffect, RefObject } from 'react';

interface UseClickOutsideOptions {
  /** CSS selector for elements that should be ignored (e.g., toggle buttons) */
  ignoreSelector?: string;
}

/**
 * Hook that handles click outside detection for dropdowns, modals, etc.
 * @param ref - React ref to the element to detect clicks outside of
 * @param onClose - Callback function to close/hide the element
 * @param isActive - Whether the detection should be active (e.g., when dropdown is open)
 * @param options - Optional configuration
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement>,
  onClose: () => void,
  isActive: boolean,
  options?: UseClickOutsideOptions
): void => {
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is on an element that should be ignored
      if (options?.ignoreSelector && target.closest(options.ignoreSelector)) {
        return;
      }

      if (ref.current && !ref.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClose, isActive, options?.ignoreSelector]);
};

/**
 * Hook for click-outside detection using CSS class selector instead of ref.
 * Useful when multiple elements with the same class need the same behavior.
 * @param selector - CSS selector to match elements
 * @param onClickOutside - Callback when clicking outside all matched elements
 * @param isActive - Whether the detection should be active
 */
export const useClickOutsideSelector = (
  selector: string,
  onClickOutside: () => void,
  isActive: boolean
): void => {
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(selector)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selector, onClickOutside, isActive]);
};

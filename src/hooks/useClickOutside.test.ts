import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should call callback when clicking outside the element', () => {
    const onClose = vi.fn();
    const refElement = document.createElement('div');
    container.appendChild(refElement);

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(refElement);
      useClickOutside(ref, onClose, true);
      return ref;
    });

    // Click outside
    const outsideClick = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideClick);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when clicking inside the element', () => {
    const onClose = vi.fn();
    const refElement = document.createElement('div');
    container.appendChild(refElement);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(refElement);
      useClickOutside(ref, onClose, true);
      return ref;
    });

    // Click inside
    const insideClick = new MouseEvent('mousedown', { bubbles: true });
    refElement.dispatchEvent(insideClick);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not call callback when isActive is false', () => {
    const onClose = vi.fn();
    const refElement = document.createElement('div');
    container.appendChild(refElement);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(refElement);
      useClickOutside(ref, onClose, false);
      return ref;
    });

    // Click outside
    const outsideClick = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideClick);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should ignore clicks on elements matching ignoreSelector', () => {
    const onClose = vi.fn();
    const refElement = document.createElement('div');
    const ignoredElement = document.createElement('button');
    ignoredElement.className = 'ignore-me';
    container.appendChild(refElement);
    container.appendChild(ignoredElement);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(refElement);
      useClickOutside(ref, onClose, true, { ignoreSelector: '.ignore-me' });
      return ref;
    });

    // Click on ignored element
    const ignoredClick = new MouseEvent('mousedown', { bubbles: true });
    ignoredElement.dispatchEvent(ignoredClick);

    expect(onClose).not.toHaveBeenCalled();
  });
});

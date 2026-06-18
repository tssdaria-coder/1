/**
 * Traps focus and scroll inside an element.
 *
 * @param {HTMLElement} element - The element to trap focus inside.
 * @returns {{ activate: () => void, deactivate: () => void }}
 */
export function trapFocusAndScrollInside(element) {
  let previouslyFocusedElement = null;
  let isActive = false;

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  function getFocusableElements() {
    return Array.from(element.querySelectorAll(focusableSelectors));
  }

  function handleKeydown(event) {
    if (!isActive) return;

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  return {
    activate() {
      isActive = true;
      previouslyFocusedElement = document.activeElement;
      document.addEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'hidden';

      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    },
    deactivate() {
      isActive = false;
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    },
  };
}

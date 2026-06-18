import { trapFocusAndScrollInside } from '@theme/focus';
import { mediaQueryLarge } from '@theme/utilities';

const OFFSET = 8;

/**
 * Anchored popover component.
 *
 * @example
 * <button data-popover-trigger aria-expanded="false" aria-controls="my-popover">Toggle</button>
 * <anchored-popover id="my-popover" role="dialog" data-anchor-to="button[data-popover-trigger]">
 *   Content here
 * </anchored-popover>
 */
class AnchoredPopover extends HTMLElement {
  #triggerButton;
  #content;
  #focusTrap;
  #controller = new AbortController();

  constructor() {
    super();
    this.#triggerButton = document.querySelector(`[aria-controls="${this.id}"]`);
    this.#content = this.querySelector('[data-popover-content]');
    this.#focusTrap = trapFocusAndScrollInside(this);
  }

  get open() {
    return this.getAttribute('aria-hidden') !== 'true';
  }

  set open(value) {
    this.setAttribute('aria-hidden', String(!value));
  }

  connectedCallback() {
    const { signal } = this.#controller;
    this.#triggerButton?.addEventListener('click', this.#onTriggerClick, { signal });
    document.addEventListener('click', this.#onDocumentClick, { signal });
    document.addEventListener('keydown', this.#onKeydown, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #onTriggerClick = () => {
    if (this.open) {
      this.close();
    } else {
      this.show();
    }
  };

  #onDocumentClick = (event) => {
    if (!this.contains(event.target) && event.target !== this.#triggerButton) {
      this.close();
    }
  };

  #onKeydown = (event) => {
    if (event.key === 'Escape') {
      this.close();
      this.#triggerButton?.focus();
    }
  };

  show() {
    this.open = true;
    this.#triggerButton?.setAttribute('aria-expanded', 'true');
    this.#position();
    this.#focusTrap.activate();
  }

  close() {
    this.open = false;
    this.#triggerButton?.setAttribute('aria-expanded', 'false');
    this.#focusTrap.deactivate();
  }

  #position() {
    const anchorSelector = this.dataset.anchorTo;
    const anchor = anchorSelector ? document.querySelector(anchorSelector) : this.#triggerButton;

    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = this.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;

    // Position horizontally
    let left = anchorRect.left;

    // Check if the popover would overflow to the right
    if (left + popoverRect.width > viewportWidth) {
      left = viewportWidth - popoverRect.width;
    }

    // Ensure the popover doesn't go off the left edge
    if (left < 0) left = 0;

    // Position vertically - default to below the anchor
    let top = anchorRect.bottom + scrollY + OFFSET;

    // If there's not enough space below, position above
    if (anchorRect.bottom + popoverRect.height + OFFSET > viewportHeight) {
      top = anchorRect.top + scrollY - popoverRect.height - OFFSET;
    }

    this.style.left = `${left}px`;
    this.style.top = `${top}px`;

    // Check if width needs to be adjusted for mobile screens
    if (!mediaQueryLarge.matches) {
      this.style.width = `${viewportWidth}px`;
    } else {
      this.style.width = '';
    }
  }
}

customElements.define('anchored-popover', AnchoredPopover);

import { CartEvents } from '@theme/cart-events';
import { trapFocusAndScrollInside } from '@theme/focus';

class CartDrawer extends HTMLElement {
  #controller = new AbortController();
  #focusTrap;

  constructor() {
    super();
    this.#focusTrap = trapFocusAndScrollInside(this);
  }

  connectedCallback() {
    const { signal } = this.#controller;
    document.addEventListener(CartEvents.openDrawer, this.#openDrawer, { signal });
    document.addEventListener(CartEvents.change, this.#onCartChange, { signal });
    this.querySelector('[data-close-drawer]')?.addEventListener('click', this.#closeDrawer, {
      signal,
    });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #openDrawer = () => {
    this.setAttribute('aria-hidden', 'false');
    this.#focusTrap.activate();
  };

  #closeDrawer = () => {
    this.setAttribute('aria-hidden', 'true');
    this.#focusTrap.deactivate();
  };

  /** @param {CustomEvent} event */
  #onCartChange = (event) => {
    if (!event.detail) return;
    const { cart, sections } = event.detail;
    if (!sections) return;

    const sectionHtml = sections['cart-drawer'];
    if (!sectionHtml) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(sectionHtml, 'text/html');
    const newDrawer = doc.querySelector('cart-drawer');

    if (newDrawer) {
      const currentInner = this.querySelector('[data-cart-drawer-inner]');
      const newInner = newDrawer.querySelector('[data-cart-drawer-inner]');
      if (currentInner && newInner) {
        currentInner.replaceWith(newInner);
      }
    }

    if (cart.item_count > 0) {
      this.#openDrawer();
    }
  };
}

customElements.define('cart-drawer', CartDrawer);

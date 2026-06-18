import { CartEvents } from '@theme/cart-events';

class CartIcon extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    document.addEventListener(CartEvents.change, this.#onCartChange, {
      signal: this.#controller.signal,
    });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  /** @param {CustomEvent} event */
  #onCartChange = (event) => {
    if (!event.detail) return;
    const { cart } = event.detail;
    this.#updateCount(cart.item_count);
  };

  /** @param {number} count */
  #updateCount(count) {
    const countEl = this.querySelector('[data-cart-count]');
    if (!countEl) return;
    countEl.textContent = count.toString();
    countEl.hidden = count === 0;
  }
}

customElements.define('cart-icon', CartIcon);

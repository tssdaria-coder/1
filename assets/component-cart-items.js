import { CartEvents } from '@theme/cart-events';

/**
 * Cart items component
 *
 * Handles updating cart item quantities and removing items
 */
class CartItems extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;

    this.addEventListener('click', this.#onButtonClick, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  /**
   * @param {MouseEvent} event
   */
  #onButtonClick = (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;

    const action = button.dataset.cartAction;
    const key = button.dataset.lineKey;
    const quantity = parseInt(button.dataset.quantity ?? '0');

    if (!key) return;

    switch (action) {
      case 'increase':
        this.#updateQuantity(key, quantity + 1);
        break;
      case 'decrease':
        this.#updateQuantity(key, Math.max(0, quantity - 1));
        break;
      case 'remove':
        this.#updateQuantity(key, 0);
        break;
    }
  };

  /**
   * @param {string} key
   * @param {number} quantity
   */
  async #updateQuantity(key, quantity) {
    const sectionIds = this.dataset.sections?.split(',') ?? [];

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: key,
          quantity,
          sections: sectionIds,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        document.dispatchEvent(
          new CustomEvent(CartEvents.error, {
            detail: { error: errorText },
            bubbles: true,
            cancelable: true,
          }),
        );
        return;
      }

      const cart = await response.json();

      document.dispatchEvent(
        new CustomEvent(CartEvents.change, {
          detail: { cart, sections: cart.sections },
          bubbles: true,
          cancelable: true,
        }),
      );
    } catch (error) {
      document.dispatchEvent(
        new CustomEvent(CartEvents.error, {
          detail: { error: error.message },
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  }
}

customElements.define('cart-items', CartItems);

/**
 * Cart total price component
 * This component listens for cart changes and updates the total price
 */
class CartTotalPrice extends HTMLElement {
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
    this.#updateTotalPrice(cart.total_price);
  };

  /** @param {number} totalPrice */
  #updateTotalPrice(totalPrice) {
    const priceEl = this.querySelector('[data-total-price]');
    if (!priceEl) return;

    const currency = priceEl.dataset.currency ?? 'USD';
    const locale = priceEl.dataset.locale ?? 'en-US';

    priceEl.textContent = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(totalPrice / 100);
  }
}

customElements.define('cart-total-price', CartTotalPrice);

/**
 * Empty cart component
 * This component listens for cart changes and shows/hides itself based on cart item count
 */
class EmptyCart extends HTMLElement {
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
    this.hidden = cart.item_count > 0;
  };
}

customElements.define('empty-cart', EmptyCart);

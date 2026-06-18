import { CartEvents } from '@theme/cart-events';

class CartDiscount extends HTMLElement {
  #discountCodes = [];
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;
    document.addEventListener(CartEvents.change, this.#onCartChange, { signal });
    document.addEventListener(CartEvents.error, this.#onCartError, { signal });

    this.querySelector('[data-discount-form]')?.addEventListener('submit', this.#onDiscountSubmit, {
      signal,
    });

    this.querySelectorAll('[data-remove-discount]').forEach((button) => {
      button.addEventListener('click', this.#onRemoveDiscount, { signal });
    });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  /** @param {CustomEvent} event */
  #onCartChange = (event) => {
    if (!event.detail) return;
    const { cart } = event.detail;
    this.#discountCodes = cart.cart_level_discount_applications
      .filter((d) => d.type === 'discount_code')
      .map((d) => d.title);
    this.#renderDiscountCodes();
  };

  /** @param {CustomEvent} event */
  #onCartError = (event) => {
    if (!event.detail) return;
    const { error } = event.detail;
    this.#renderError(error);
  };

  /** @param {SubmitEvent} event */
  #onDiscountSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const discountInput = form.querySelector('[name="discount"]');
    if (!discountInput) return;

    const discountCode = discountInput.value.trim();
    if (!discountCode) return;

    await this.#applyDiscountCode(discountCode);
  };

  #onRemoveDiscount = async (event) => {
    const button = event.currentTarget;
    const code = button.dataset.removeDiscount;
    if (!code) return;
    await this.#applyDiscountCode('');
  };

  /** @param {string} discountCode */
  async #applyDiscountCode(discountCode) {
    try {
      const response = await fetch('/discount/' + discountCode, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to apply discount');

      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();

      document.dispatchEvent(
        new CustomEvent(CartEvents.change, {
          detail: { cart },
          bubbles: true,
          cancelable: true,
        }),
      );
    } catch (error) {
      document.dispatchEvent(
        new CustomEvent(CartEvents.error, {
          detail: { error: 'Failed to apply discount code' },
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  }

  /** @param {string[]} discountCodes */
  #renderDiscountCodes() {
    const container = this.querySelector('[data-discount-codes]');
    if (!container) return;

    if (this.#discountCodes.length === 0) {
      container.innerHTML = '';
      return;
    }

    const removeLabel = container.dataset.removeLabel || 'Remove';
    container.innerHTML = this.#discountCodes
      .map(
        (code) =>
          `<div class="cart-discount__code">
        <span>${code}</span>
        <button class="cart-discount__remove" data-remove-discount="${code}" type="button">
          ${removeLabel}
        </button>
      </div>`,
      )
      .join('');

    container.querySelectorAll('[data-remove-discount]').forEach((button) => {
      button.addEventListener('click', this.#onRemoveDiscount);
    });
  }

  #renderError(message) {
    const errorEl = this.querySelector('[data-discount-error]');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
    setTimeout(() => {
      errorEl.hidden = true;
    }, 3000);
  }
}

customElements.define('cart-discount', CartDiscount);

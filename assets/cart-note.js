import { CartEvents } from '@theme/cart-events';

class CartNote extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;
    this.querySelector('textarea')?.addEventListener('change', this.#onNoteChange, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #onNoteChange = async (event) => {
    const note = event.target.value;
    try {
      const response = await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const cart = await response.json();
      document.dispatchEvent(
        new CustomEvent(CartEvents.change, {
          detail: { cart },
          bubbles: true,
          cancelable: true,
        }),
      );
    } catch (error) {
      console.error('Failed to update cart note:', error);
    }
  };
}

customElements.define('cart-note', CartNote);

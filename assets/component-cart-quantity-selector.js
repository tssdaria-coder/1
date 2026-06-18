import { CartEvents } from '@theme/cart-events';
import { QuantitySelector } from '@theme/component-quantity-selector';

class CartQuantitySelector extends QuantitySelector {
  async updateQuantity(key, quantity) {
    const sectionIds = this.dataset.sections?.split(',') ?? [];

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
  }
}

customElements.define('cart-quantity-selector', CartQuantitySelector);

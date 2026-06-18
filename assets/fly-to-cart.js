import { CartEvents } from '@theme/cart-events';

class FlyToCart extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    document.addEventListener(CartEvents.flyToCart, this.#onFlyToCart, {
      signal: this.#controller.signal,
    });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #onFlyToCart = (event) => {
    const { imageUrl, startRect } = event.detail;
    this.#animate(imageUrl, startRect);
  };

  /**
   * @param {string} imageUrl
   * @param {DOMRect} startRect
   */
  #animate(imageUrl, startRect) {
    const cartIconEl = document.querySelector('[data-cart-icon]');
    if (!cartIconEl) return;

    const endRect = cartIconEl.getBoundingClientRect();
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'fly-to-cart__image';
    document.body.appendChild(img);

    img.style.position = 'fixed';
    img.style.width = `${startRect.width}px`;
    img.style.height = `${startRect.height}px`;
    img.style.top = `${startRect.top}px`;
    img.style.left = `${startRect.left}px`;
    img.style.zIndex = '9999';
    img.style.transition = 'none';

    requestAnimationFrame(() => {
      img.animate(
        [
          { top: `${startRect.top}px`, left: `${startRect.left}px`, width: `${startRect.width}px`, height: `${startRect.height}px`, opacity: 1 },
          { top: `${endRect.top}px`, left: `${endRect.left}px`, width: '20px', height: '20px', opacity: 0 },
        ],
        { duration: 800, easing: 'ease-in-out' },
      ).addEventListener('finish', () => img.remove());
    });
  }
}

customElements.define('fly-to-cart', FlyToCart);

import { Component } from '@theme/component';
import { QuantitySelectorUpdateEvent } from '@theme/events';
import { parseIntOrDefault } from '@theme/utilities';

/**
 * A custom element that allows the user to select a quantity.
 *
 * This component follows a pure event-driven architecture where quantity changes
 * are broadcast via QuantitySelectorUpdateEvent. Parent components that contain
 * quantity selectors listen for these events and handle them according to their
 * specific needs, with event filtering ensuring each parent only processes events
 * from its own quantity selectors to prevent conflicts between different cart
 * update strategies.
 *
 * @typedef {Object} Refs
 * @property {HTMLInputElement} quantityInput
 * @property {HTMLButtonElement} minusButton
 * @property {HTMLButtonElement} plusButton
 *
 * @extends {Component<Refs>}
 */
export class QuantitySelectorComponent extends Component {
  requiredRefs = ['quantityInput', 'minusButton', 'plusButton'];
  serverDisabledMinus = false;
  serverDisabledPlus = false;
  initialized = false;

  connectedCallback() {
    super.connectedCallback();

    // Capture server-disabled state on first load
    const { minusButton, plusButton } = this.refs;

    if (minusButton.disabled) {
      this.serverDisabledMinus = true;
    }
    if (plusButton.disabled) {
      this.serverDisabledPlus = true;
    }

    this.initialized = true;
    this.updateButtonStates();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  /**
   * Updates cart quantity and refreshes component state
   * @param {number} cartQty - The quantity currently in cart for this variant
   */
  setCartQuantity(cartQty) {
    this.refs.quantityInput.setAttribute('data-cart-quantity', cartQty.toString());
    this.updateCartQuantity();
  }

  /**
   * Checks if the current quantity can be added to cart without exceeding limits
   * @returns {boolean}
   */
  canAddToCart() {
    const { quantityInput } = this.refs;
    const cartQuantity = parseIntOrDefault(quantityInput.dataset.cartQuantity, 0);
    const availableQuantity = parseIntOrDefault(quantityInput.dataset.availableQuantity, Infinity);
    const maxQuantity = parseIntOrDefault(quantityInput.getAttribute('max'), Infinity);
    const currentValue = parseIntOrDefault(quantityInput.value, 1);
    return cartQuantity + currentValue <= Math.min(availableQuantity, maxQuantity);
  }

  /**
   * Updates cart quantity from data attribute and syncs button states
   */
  updateCartQuantity() {
    const { quantityInput } = this.refs;
    const cartQuantity = parseIntOrDefault(quantityInput.dataset.cartQuantity, 0);
    quantityInput.setAttribute('data-cart-quantity', cartQuantity.toString());
    this.updateButtonStates();
  }

  updateButtonStates() {
    if (!this.initialized) return;

    const { quantityInput, minusButton, plusButton } = this.refs;

    const value = parseIntOrDefault(quantityInput.value, 1);
    const minValue = parseIntOrDefault(quantityInput.getAttribute('min'), 0);
    const maxValue = parseIntOrDefault(quantityInput.getAttribute('max'), Infinity);
    const cartQuantity = parseIntOrDefault(quantityInput.dataset.cartQuantity, 0);
    const availableQuantity = parseIntOrDefault(quantityInput.dataset.availableQuantity, Infinity);

    const effectiveMax = Math.min(availableQuantity, maxValue) - cartQuantity;

    minusButton.disabled = this.serverDisabledMinus || value <= minValue;
    plusButton.disabled = this.serverDisabledPlus || value >= effectiveMax;
  }
}

/**
 * @deprecated Use QuantitySelectorComponent instead
 */
export class QuantitySelector extends HTMLElement {
  /** @type {HTMLInputElement} */
  get input() {
    return this.querySelector('input[type="number"]');
  }

  /** @type {HTMLButtonElement} */
  get decreaseButton() {
    return this.querySelector('[data-decrease]');
  }

  /** @type {HTMLButtonElement} */
  get increaseButton() {
    return this.querySelector('[data-increase]');
  }

  connectedCallback() {
    this.decreaseButton?.addEventListener('click', () => this.#handleDecrease());
    this.increaseButton?.addEventListener('click', () => this.#handleIncrease());
  }

  #handleDecrease() {
    const key = this.dataset.lineKey;
    if (!key) return;
    const currentQty = parseInt(this.input?.value ?? '0');
    if (currentQty <= 0) return;
    this.updateQuantity(key, currentQty - 1);
  }

  #handleIncrease() {
    const key = this.dataset.lineKey;
    if (!key) return;
    const currentQty = parseInt(this.input?.value ?? '0');
    this.updateQuantity(key, currentQty + 1);
  }

  /**
   * Override this method to handle quantity updates
   * @param {string} key
   * @param {number} quantity
   */
  async updateQuantity(key, quantity) {}
}

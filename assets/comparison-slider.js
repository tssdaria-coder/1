class ComparisonSlider extends HTMLElement {
  /** @type {HTMLImageElement | null} */
  #beforeImage = null;

  /** @type {HTMLElement | null} */
  #divider = null;

  /** @type {HTMLInputElement | null} */
  #slider = null;

  connectedCallback() {
    this.#beforeImage = this.querySelector('[data-before-image]');
    this.#divider = this.querySelector('[data-divider]');
    this.#slider = this.querySelector('[data-slider]');

    if (!this.#slider) return;

    this.#slider.addEventListener('input', () => this.#updatePosition(Number(this.#slider?.value)));
    this.#updatePosition(Number(this.#slider.value));
  }

  /** @param {number} value */
  #updatePosition(value) {
    if (this.#beforeImage) this.#beforeImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
    if (this.#divider) this.#divider.style.left = `${value}%`;
  }
}

customElements.define('comparison-slider', ComparisonSlider);

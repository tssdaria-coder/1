class AnnouncementBar extends HTMLElement {
  #controller = new AbortController();
  #slides;
  #currentIndex = 0;
  #interval;

  connectedCallback() {
    const { signal } = this.#controller;
    this.#slides = this.querySelectorAll('.announcement-bar__slide');

    if (this.#slides.length <= 1) return;

    const prevButton = this.querySelector('.announcement-bar__btn--prev');
    const nextButton = this.querySelector('.announcement-bar__btn--next');

    prevButton?.addEventListener('click', () => this.#prev(), { signal });
    nextButton?.addEventListener('click', () => this.#next(), { signal });

    this.#startAutoplay();
  }

  disconnectedCallback() {
    this.#controller.abort();
    clearInterval(this.#interval);
  }

  #showSlide(index) {
    this.#slides.forEach((slide, i) => {
      slide.hidden = i !== index;
    });
    this.#currentIndex = index;
  }

  #prev() {
    const prevIndex = (this.#currentIndex - 1 + this.#slides.length) % this.#slides.length;
    this.#showSlide(prevIndex);
  }

  #next() {
    const nextIndex = (this.#currentIndex + 1) % this.#slides.length;
    this.#showSlide(nextIndex);
  }

  #startAutoplay() {
    const delay = parseInt(this.dataset.autoplayDelay ?? '5000');
    if (isNaN(delay) || delay <= 0) return;

    this.#interval = setInterval(() => this.#next(), delay);
  }
}

customElements.define('announcement-bar', AnnouncementBar);

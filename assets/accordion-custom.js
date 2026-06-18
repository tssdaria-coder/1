import { mediaQueryLarge, isMobileBreakpoint } from '@theme/utilities';

// Accordion
// Still extends HTMLElement over Component so that refs are still available to parent components (e.g. SortingFilterComponent)
class AccordionCustom extends HTMLElement {
  /** @type {HTMLDetailsElement} */
  get details() {
    const details = this.querySelector('details');

    if (!(details instanceof HTMLDetailsElement)) throw new Error('Details element not found');

    return details;
  }

  /** @type {HTMLElement} */
  get summary() {
    const summary = this.details.querySelector('summary');

    if (!(summary instanceof HTMLElement)) throw new Error('Summary element not found');

    return summary;
  }

  get #disableOnMobile() {
    return this.dataset.disableOnMobile === 'true';
  }

  get #disableOnDesktop() {
    return this.dataset.disableOnDesktop === 'true';
  }

  get #closeWithEscape() {
    return this.dataset.closeWithEscape === 'true';
  }

  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;

    this.#setDefaultOpenState();

    this.addEventListener('keydown', this.#handleKeyDown, { signal });
    this.summary.addEventListener('click', this.handleClick, { signal });
    mediaQueryLarge.addEventListener('change', this.#handleMediaQueryChange, { signal });
  }

  /**
   * Handles the disconnect event.
   */
  disconnectedCallback() {
    // Disconnect all the event listeners
    this.#controller.abort();
  }

  /**
   * @param {MouseEvent} event
   */
  handleClick = (event) => {
    event.preventDefault();

    // If we're already animating, don't do anything
    if (this.details.dataset.transitioning) return;

    if (this.details.open) {
      this.#close();
    } else {
      this.#open();
    }
  };

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event
   */
  #handleKeyDown = (event) => {
    if (event.key === 'Escape' && this.#closeWithEscape) {
      this.#close();
    }
  };

  #handleMediaQueryChange = () => {
    this.#setDefaultOpenState();
  };

  #setDefaultOpenState() {
    if (isMobileBreakpoint() && this.#disableOnMobile) {
      this.details.open = true;
    } else if (!isMobileBreakpoint() && this.#disableOnDesktop) {
      this.details.open = true;
    }
  }

  #open() {
    if (this.details.open) return;
    this.details.open = true;
    const content = this.details.querySelector('.js-accordion-content');
    if (!content) return;
    content.animate([{ height: '0px' }, { height: `${content.scrollHeight}px` }], {
      duration: 200,
      easing: 'ease-in-out',
    });
  }

  #close() {
    if (!this.details.open) return;

    const content = this.details.querySelector('.js-accordion-content');
    if (!content) return;

    const animation = content.animate([{ height: `${content.scrollHeight}px` }, { height: '0px' }], {
      duration: 200,
      easing: 'ease-in-out',
    });

    this.details.dataset.transitioning = 'true';

    animation.addEventListener('finish', () => {
      this.details.open = false;
      delete this.details.dataset.transitioning;
    });
  }
}

customElements.define('accordion-custom', AccordionCustom);

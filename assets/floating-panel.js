class FloatingPanel extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;
    document.addEventListener('click', this.#onDocumentClick, { signal });
    this.querySelector('[data-floating-panel-trigger]')?.addEventListener(
      'click',
      this.#onTriggerClick,
      { signal },
    );
    this.querySelector('[data-floating-panel-close]')?.addEventListener('click', this.close.bind(this), {
      signal,
    });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  get open() {
    return this.hasAttribute('open');
  }

  #onTriggerClick = () => {
    if (this.open) {
      this.close();
    } else {
      this.show();
    }
  };

  #onDocumentClick = (event) => {
    if (!this.contains(event.target)) {
      this.close();
    }
  };

  show() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }
}

customElements.define('floating-panel', FloatingPanel);

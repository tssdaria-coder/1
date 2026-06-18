class AutoCloseDetails extends HTMLElement {
  connectedCallback() {
    document.addEventListener('click', this.#onDocumentClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.#onDocumentClick);
  }

  #onDocumentClick = (event) => {
    if (!(event.target instanceof Node)) return;

    if (!this.contains(event.target)) {
      this.querySelectorAll('details[open]').forEach((details) => {
        details.open = false;
      });
    }
  };
}

customElements.define('auto-close-details', AutoCloseDetails);

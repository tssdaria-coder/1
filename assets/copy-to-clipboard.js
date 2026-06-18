class CopyToClipboard extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
  }

  #onClick = () => {
    const text = this.dataset.text;
    if (!text) return;
    navigator.clipboard.writeText(text);
  };
}

customElements.define('copy-to-clipboard', CopyToClipboard);

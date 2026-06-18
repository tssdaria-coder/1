import { trapFocusAndScrollInside } from '@theme/focus';

class DialogElement extends HTMLElement {
  #controller = new AbortController();
  #focusTrap;

  constructor() {
    super();
    this.#focusTrap = trapFocusAndScrollInside(this);
  }

  connectedCallback() {
    const { signal } = this.#controller;
    this.querySelector('[data-dialog-close]')?.addEventListener('click', this.close.bind(this), {
      signal,
    });
    document.addEventListener('keydown', this.#onKeydown, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  get open() {
    return this.getAttribute('aria-hidden') !== 'true';
  }

  show() {
    this.setAttribute('aria-hidden', 'false');
    this.#focusTrap.activate();
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.setAttribute('aria-hidden', 'true');
    this.#focusTrap.deactivate();
    document.body.style.overflow = '';
  }

  #onKeydown = (event) => {
    if (event.key === 'Escape' && this.open) {
      this.close();
    }
  };
}

customElements.define('dialog-element', DialogElement);

class DialogTrigger extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;
    this.addEventListener('click', this.#onClick, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #onClick = () => {
    const targetId = this.dataset.dialogTarget;
    if (!targetId) return;
    const dialog = document.getElementById(targetId);
    if (dialog instanceof DialogElement) {
      dialog.show();
    }
  };
}

customElements.define('dialog-trigger', DialogTrigger);

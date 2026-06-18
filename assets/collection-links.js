class CollectionLinks extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;
    const select = this.querySelector('select');
    select?.addEventListener('change', this.#onSelectChange, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #onSelectChange = (event) => {
    window.location.href = event.target.value;
  };
}

customElements.define('collection-links', CollectionLinks);

class CollectionFiltersForm extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;
    this.querySelectorAll('[data-collection-filter]').forEach((el) => {
      el.addEventListener('change', this.#onFilterChange, { signal });
    });
    this.querySelector('[data-price-filter-submit]')?.addEventListener('click', this.#onFilterChange, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #onFilterChange = () => {
    const form = this.querySelector('form');
    if (!form) return;

    const formData = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (value) params.append(key, value.toString());
    }

    const url = new URL(window.location.href);
    url.search = params.toString();
    window.location.href = url.toString();
  };
}

customElements.define('collection-filters-form', CollectionFiltersForm);

class SortByFilter extends HTMLElement {
  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;
    const select = this.querySelector('select');
    select?.addEventListener('change', this.#onSelectChange, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  #onSelectChange = (event) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', event.target.value);
    window.location.href = url.toString();
  };
}

customElements.define('sort-by-filter', SortByFilter);

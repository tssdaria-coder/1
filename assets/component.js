/**
 * Base class for all custom elements that use refs.
 *
 * @template {Record<string, HTMLElement>} T
 */
export class Component extends HTMLElement {
  /**
   * The refs object. This is populated by the `connectedCallback` method.
   * @type {T}
   */
  refs = {};

  /**
   * The required refs. If any of these are missing, an error will be thrown.
   * @type {string[]}
   */
  requiredRefs = [];

  connectedCallback() {
    this.#collectRefs();
  }

  disconnectedCallback() {}

  #collectRefs() {
    const refElements = this.querySelectorAll('[data-ref]');

    for (const el of refElements) {
      const refName = el.dataset.ref;
      if (!refName) continue;

      // Skip refs that are nested inside child components
      const closestComponent = el.parentElement?.closest('[data-ref-scope]');
      if (closestComponent && closestComponent !== this) continue;

      // @ts-ignore
      this.refs[refName] = el;
    }

    for (const requiredRef of this.requiredRefs) {
      if (!this.refs[requiredRef]) {
        console.warn(`Required ref '${requiredRef}' not found in ${this.tagName.toLowerCase()}`);
      }
    }
  }

  /**
   * Gets a component by its tag name from the document.
   *
   * @template {typeof Component} T
   * @param {T} componentClass
   * @param {string} [selector]
   * @returns {InstanceType<T> | null}
   */
  static getComponent(componentClass, selector) {
    const tagName = [...customElements['_registry'].entries()].find(
      ([, cls]) => cls === componentClass,
    )?.[0];

    if (!tagName) {
      console.warn(`Component class ${componentClass.name} is not registered.`);
      return null;
    }

    return /** @type {InstanceType<T>} */ (
      document.querySelector(selector ? `${tagName}${selector}` : tagName)
    );
  }

  /**
   * Gets all components by tag name from the document.
   *
   * @template {typeof Component} T
   * @param {T} componentClass
   * @param {string} [selector]
   * @returns {InstanceType<T>[]}
   */
  static getComponents(componentClass, selector) {
    const tagName = [...customElements['_registry'].entries()].find(
      ([, cls]) => cls === componentClass,
    )?.[0];

    if (!tagName) {
      console.warn(`Component class ${componentClass.name} is not registered.`);
      return [];
    }

    return /** @type {InstanceType<T>[]} */ (
      [...document.querySelectorAll(selector ? `${tagName}${selector}` : tagName)]
    );
  }

  /**
   * Gets a component of the given class from the document. Waits for it to be defined if not yet.
   *
   * @template {typeof Component} T
   * @param {T} componentClass
   * @param {string} [selector]
   * @returns {Promise<InstanceType<T> | null>}
   */
  static async getComponentAsync(componentClass, selector) {
    const tagName = [...customElements['_registry'].entries()].find(
      ([, cls]) => cls === componentClass,
    )?.[0];

    if (!tagName) {
      console.warn(`Component class ${componentClass.name} is not registered.`);
      return null;
    }

    await customElements.whenDefined(tagName);

    return /** @type {InstanceType<T>} */ (
      document.querySelector(selector ? `${tagName}${selector}` : tagName)
    );
  }

  /**
   * Dispatches a custom event on the element.
   *
   * @param {string} eventName
   * @param {Object} [detail]
   * @returns {boolean}
   */
  emit(eventName, detail) {
    return this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail,
      }),
    );
  }
}

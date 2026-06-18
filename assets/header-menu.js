import { Component } from '@theme/component';
import { debounce, onDocumentLoaded, setHeaderMenuStyle } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

class HeaderMenu extends Component {
  requiredRefs = ['overflowMenu'];
  #submenuMutationObserver = null;

  connectedCallback() {
    super.connectedCallback();
    onDocumentLoaded(this.#preloadImages);
    window.addEventListener('resize', this.#resizeListener);
    this.overflowMenu?.addEventListener('pointerleave', this.#overflowSubmenuListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.#resizeListener);
    document.body.removeEventListener('pointermove', this.#onPointerMove);
    if (this.#state.activeItem) this.#stopPointerTracking(this.#state.activeItem);
    this.overflowMenu?.removeEventListener('pointerleave', this.#overflowSubmenuListener);
    this.#cleanupMutationObserver();
  }

  #resizeListener = debounce(() => { setHeaderMenuStyle(); }, 100);
  #overflowSubmenuListener = () => { this.#deactivate(); };
  #state = { activeItem: null };
  #pointerIdleTimer;
  #lastPointer = { x: 0, y: 0 };

  #onPointerMove = (event) => {
    const activeLink = this.#state.activeItem;
    if (!activeLink) return;
    this.#lastPointer.x = event.clientX;
    this.#lastPointer.y = event.clientY;
    const moving = Math.abs(event.movementX) >= 1 || event.movementY >= 1;
    activeLink.dataset.safetyBox = `${moving}`;
    clearTimeout(this.#pointerIdleTimer);
    if (moving) {
      this.#pointerIdleTimer = setTimeout(() => {
        if (this.#state.activeItem) {
          this.#state.activeItem.dataset.safetyBox = 'false';
          this.#reconcilePointerTarget();
        }
      }, 50);
    } else {
      this.#reconcilePointerTarget();
    }
  };

  #reconcilePointerTarget() {
    const { x, y } = this.#lastPointer;
    requestAnimationFrame(() => {
      const target = document.elementFromPoint(x, y);
      if (!target) return;
      const listItem = target.closest('.menu-list__list-item');
      if (listItem && !listItem.contains(this.#state.activeItem)) {
        listItem.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
      }
    });
  }

  #startPointerTracking(item, previousItem) {
    if (previousItem) {
      this.#stopPointerTracking(previousItem);
    } else {
      document.body.addEventListener('pointermove', this.#onPointerMove);
    }
    const rect = item.getBoundingClientRect();
    const isOverlap = this.headerComponent?.hasAttribute('data-submenu-overlap-bottom-row');
    const boundary = isOverlap ? this.headerComponent?.querySelector('.header__row--top') : this.headerComponent;
    item.style.setProperty('--box-height', `${(boundary?.getBoundingClientRect().bottom ?? 0) - rect.top}px`);
  }

  #stopPointerTracking(item) {
    clearTimeout(this.#pointerIdleTimer);
    this.#pointerIdleTimer = undefined;
    item.style.removeProperty('--box-height');
    delete item.dataset.safetyBox;
  }

  get overflowMenu() {
    return this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow"]');
  }

  get overflowListHovered() {
    return this.refs.overflowMenu?.shadowRoot?.querySelector('[part="overflow-list"]')?.matches(':hover') ?? false;
  }

  get headerComponent() {
    return this.closest('header-component');
  }

  activate = (event) => {
    this.dispatchEvent(new MegaMenuHoverEvent());
    if (!(event.target instanceof Element) || !this.headerComponent) return;
    let item = findMenuItem(event.target);
    if (!item || item == this.#state.activeItem) return;
    const isDefaultSlot = event.target.slot === '';
    this.dataset.overflowExpanded = (!isDefaultSlot).toString();
    const previouslyActiveItem = this.#state.activeItem;
    if (previouslyActiveItem) previouslyActiveItem.ariaExpanded = 'false';
    this.#state.activeItem = item;
    this.ariaExpanded = 'true';
    item.ariaExpanded = 'true';
    let submenu = findSubmenu(item);
    const hasSubmenu = Boolean(submenu);
    if (!hasSubmenu && !isDefaultSlot) submenu = this.overflowMenu;
    if (submenu) {
      submenu.dataset.active = '';
      this.#cleanupMutationObserver();
      this.#submenuMutationObserver = new MutationObserver(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (submenu.offsetHeight > 0) {
              this.headerComponent?.style.setProperty('--submenu-height', `${submenu.offsetHeight}px`);
              this.#cleanupMutationObserver();
            }
          });
        });
      });
      this.#submenuMutationObserver.observe(submenu, { childList: true, subtree: true });
      setTimeout(() => { this.#cleanupMutationObserver(); }, 500);
    }
    let finalHeight = submenu?.offsetHeight || 0;
    if (!isDefaultSlot) {
      const overflowListHeight = this.#getOverflowListLinksHeight();
      if (hasSubmenu) {
        const overflowHeight = this.overflowMenu?.offsetHeight || 0;
        finalHeight = Math.max(overflowHeight, overflowListHeight);
      } else {
        finalHeight = overflowListHeight;
      }
    }
    if (!submenu) finalHeight = 0;
    this.headerComponent.style.setProperty('--submenu-height', `${finalHeight}px`);
    this.#setFullOpenHeaderHeight(finalHeight);
    this.style.setProperty('--submenu-opacity', '1');
    this.#startPointerTracking(item, previouslyActiveItem);
  };

  deactivate(event) {
    if (!(event.target instanceof Element)) return;
    const menu = findSubmenu(this.#state.activeItem);
    const isMovingWithinMenu = event.relatedTarget instanceof Node && menu?.contains(document.activeElement);
    const isMovingToSubmenu = event.relatedTarget instanceof Node && event.type === 'blur' && menu?.contains(event.relatedTarget);
    const isMovingToOverflowMenu = event.relatedTarget instanceof Node && event.relatedTarget.parentElement?.matches('[slot="overflow"]');
    if (isMovingWithinMenu || isMovingToOverflowMenu || isMovingToSubmenu) {
      if (this.#state.activeItem) this.#stopPointerTracking(this.#state.activeItem);
      return;
    }
    this.#deactivate();
  }

  #deactivate = (item = this.#state.activeItem) => {
    if (!item || item != this.#state.activeItem) return;
    if (this.overflowListHovered || this.overflowMenu?.matches(':hover')) return;
    this.headerComponent?.style.setProperty('--submenu-height', '0px');
    this.#setFullOpenHeaderHeight(0);
    this.style.setProperty('--submenu-opacity', '0');
    this.dataset.overflowExpanded = 'false';
    const submenu = findSubmenu(item);
    document.body.removeEventListener('pointermove', this.#onPointerMove);
    this.#stopPointerTracking(item);
    this.#state.activeItem = null;
    this.ariaExpanded = 'false';
    item.ariaExpanded = 'false';
    if (submenu) delete submenu.dataset.active;
  };

  #getOverflowListLinksHeight() {
    const slottedMenuLinks = this.overflowMenu?.querySelector('slot')?.assignedElements();
    if (!slottedMenuLinks) return this.overflowMenu?.offsetHeight || 0;
    const mapSubmenus = (cb) => {
      slottedMenuLinks.forEach((link) => {
        const submenu = link.querySelector('[ref="submenu[]"]');
        if (submenu) cb(submenu);
      });
    };
    mapSubmenus((submenu) => { submenu.style.setProperty('display', 'none'); });
    const height = this.overflowMenu?.offsetHeight || 0;
    mapSubmenus((submenu) => { submenu.style.removeProperty('display'); });
    return height;
  }

  #setFullOpenHeaderHeight(submenuHeight) {
    if (!this.headerComponent) return;
    const isOverlapSituation = this.headerComponent.hasAttribute('data-submenu-overlap-bottom-row');
    const headerVisibleHeight = isOverlapSituation && this.headerComponent.offsetHeight > 0
      ? this.headerComponent.querySelector('.header__row--top')?.offsetHeight ?? 0
      : this.headerComponent.offsetHeight;
    const nothingToOpen = submenuHeight === 0;
    const fullOpenHeaderHeight = nothingToOpen ? 0 : submenuHeight + (headerVisibleHeight ?? 0);
    this.headerComponent?.style.setProperty('--full-open-header-height', `${fullOpenHeaderHeight}px`);
  }

  #preloadImages = () => {
    const images = this.querySelectorAll('img[loading="lazy"]');
    images?.forEach((image) => image.removeAttribute('loading'));
  };

  #cleanupMutationObserver() {
    this.#submenuMutationObserver?.disconnect();
    this.#submenuMutationObserver = null;
  }
}

if (!customElements.get('header-menu')) {
  customElements.define('header-menu', HeaderMenu);
}

function findMenuItem(element) {
  if (!(element instanceof Element)) return null;
  if (element?.matches('[slot="more"')) {
    return findMenuItem(element.parentElement?.querySelector('[slot="overflow"]'));
  }
  return element?.querySelector('[ref="menuitem"]');
}

function findSubmenu(element) {
  const submenu = element?.parentElement?.querySelector('[ref="submenu[]"]');
  return submenu instanceof HTMLElement ? submenu : null;
}

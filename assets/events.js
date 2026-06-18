/**
 * @namespace ThemeEvents
 * @description A collection of theme-specific events that can be used to trigger and listen for changes anywhere in the theme.
 * @example
 * document.dispatchEvent(new VariantUpdateEvent(variant, sectionId, { html }));
 * document.addEventListener(ThemeEvents.variantUpdate, (e) => { console.log(e.detail.variant) });
 */
export class ThemeEvents {
  /** @static @constant {string} Event triggered when a variant is selected */
  static variantSelected = 'variant:selected';
  /** @static @constant {string} Event triggered when a variant is changed */
  static variantUpdate = 'variant:update';
  /** @static @constant {string} Event triggered when the cart items or quantities are updated */
  static cartUpdate = 'cart:update';
  /** @static @constant {string} Event triggered when a cart update fails */
  static cartError = 'cart:error';
  /** @static @constant {string} Event triggered when a media (video, 3d model) is loaded */
  static mediaStartedPlaying = 'media:started-playing';
  // Event triggered when quantity-selector value is changed
  static quantitySelectorUpdate = 'quantity-selector:update';
  /** @static @constant {string} Event triggered when a predictive search is expanded */
  static megaMenuHover = 'megaMenu:hover';
  /** @static @constant {string} Event triggered when a zoom dialog media is selected */
  static zoomMediaSelected = 'zoom-media:selected';
  /** @static @constant {string} Event triggered when a discount is applied */
  static discountUpdate = 'discount:update';
  /** @static @constant {string} Event triggered when changing collection filters */
  static FilterUpdate = 'filter:update';
}

export class VariantSelectedEvent extends Event {
  constructor(resource) {
    super(ThemeEvents.variantSelected, { bubbles: true });
    this.detail = { resource };
  }
}

export class VariantUpdateEvent extends Event {
  constructor(resource, sourceId, data) {
    super(ThemeEvents.variantUpdate, { bubbles: true });
    this.detail = {
      resource: resource || null,
      sourceId,
      data: {
        html: data.html,
        productId: data.productId,
        newProduct: data.newProduct,
      },
    };
  }
}

export class CartAddEvent extends Event {
  constructor(resource, sourceId, data) {
    super(CartAddEvent.eventName, { bubbles: true });
    this.detail = { resource, sourceId, data: { ...data } };
  }

  static eventName = ThemeEvents.cartUpdate;
}

export class CartUpdateEvent extends Event {
  constructor(resource, sourceId, data) {
    super(ThemeEvents.cartUpdate, { bubbles: true });
    this.detail = { resource, sourceId, data: { ...data } };
  }
}

export class CartErrorEvent extends Event {
  constructor(sourceId, message, description, errors) {
    super(ThemeEvents.cartError, { bubbles: true });
    this.detail = { sourceId, data: { message, errors, description } };
  }
}

export class QuantitySelectorUpdateEvent extends Event {
  constructor(quantity, cartLine) {
    super(ThemeEvents.quantitySelectorUpdate, { bubbles: true });
    this.detail = { quantity, cartLine };
  }
}

export class DiscountUpdateEvent extends Event {
  constructor(resource, sourceId) {
    super(ThemeEvents.discountUpdate, { bubbles: true });
    this.detail = { resource, sourceId };
  }
}

export class MediaStartedPlayingEvent extends Event {
  constructor(resource) {
    super(ThemeEvents.mediaStartedPlaying, { bubbles: true });
    this.detail = { resource };
  }
}

export class SlideshowSelectEvent extends Event {
  constructor(data) {
    super(SlideshowSelectEvent.eventName, { bubbles: true });
    this.detail = data;
  }

  detail;

  static eventName = 'slideshow:select';
}

export class ZoomMediaSelectedEvent extends Event {
  constructor(index) {
    super(ThemeEvents.zoomMediaSelected, { bubbles: true });
    this.detail = { index };
  }
}

export class MegaMenuHoverEvent extends Event {
  constructor() {
    super(ThemeEvents.megaMenuHover, { bubbles: true });
  }
}

export class FilterUpdateEvent extends Event {
  constructor(queryParams) {
    super(ThemeEvents.FilterUpdate, { bubbles: true });
    this.detail = { queryParams };
  }

  shouldShowClearAll() {
    return [...this.detail.queryParams.entries()].filter(([key]) => key.startsWith('filter.')).length > 0;
  }
}

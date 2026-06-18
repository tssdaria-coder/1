import { Component } from '@theme/component';
import { ThemeEvents, CartErrorEvent, CartAddEvent } from '@theme/events';

class GiftCardRecipientForm extends Component {
  static DeliveryMode = {
    SELF: 'self',
    RECIPIENT: 'recipient_form',
  };

  #currentMode = GiftCardRecipientForm.DeliveryMode.SELF;
  #updateCharacterCountBound = null;
  #displayCartErrorBound = null;
  #cartAddEventBound = null;

  requiredRefs = [
    'myEmailButton',
    'recipientEmailButton',
    'recipientFields',
    'recipientEmail',
    'recipientName',
    'recipientMessage',
    'recipientSendOn',
  ];

  get #inputFields() {
    return [this.refs.recipientEmail, this.refs.recipientName, this.refs.recipientMessage, this.refs.recipientSendOn];
  }

  connectedCallback() {
    super.connectedCallback();
    this.#initializeForm();

    this.#updateCharacterCountBound = () => this.#updateCharacterCount();
    this.refs.recipientMessage.addEventListener('input', this.#updateCharacterCountBound);

    this.#displayCartErrorBound = this.#displayCartError.bind(this);
    document.addEventListener(ThemeEvents.cartError, this.#displayCartErrorBound);

    this.#cartAddEventBound = () => this.#handleCartAdd();
    document.addEventListener(ThemeEvents.cartUpdate, this.#cartAddEventBound);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#updateCharacterCountBound) {
      this.refs.recipientMessage.removeEventListener('input', this.#updateCharacterCountBound);
      this.#updateCharacterCountBound = null;
    }

    if (this.#displayCartErrorBound) {
      document.removeEventListener(ThemeEvents.cartError, this.#displayCartErrorBound);
      this.#displayCartErrorBound = null;
    }

    if (this.#cartAddEventBound) {
      document.removeEventListener(ThemeEvents.cartUpdate, this.#cartAddEventBound);
      this.#cartAddEventBound = null;
    }
  }

  #initializeForm() {
    this.#updateButtonStates(GiftCardRecipientForm.DeliveryMode.SELF);
    this.refs.recipientFields.hidden = true;
    this.#clearRecipientFields();
    this.#disableRecipientFields();
    this.#setDateConstraints();
  }

  toggleRecipientForm(mode, _event) {
    if (!Object.values(GiftCardRecipientForm.DeliveryMode).includes(mode)) {
      throw new Error(`Invalid delivery mode: ${mode}`);
    }
    if (this.#currentMode === mode) return;
    this.#currentMode = mode;
    this.#updateFormState();
  }

  #updateFormState() {
    const { DeliveryMode } = GiftCardRecipientForm;
    const isRecipientMode = this.#currentMode === DeliveryMode.RECIPIENT;

    this.#updateButtonStates(this.#currentMode);
    this.refs.recipientFields.hidden = !isRecipientMode;

    if (isRecipientMode) {
      this.#enableRecipientFields();
      this.#updateCharacterCount();
      if (this.refs.liveRegion) {
        this.refs.liveRegion.textContent = Theme.translations?.recipient_form_fields_visible || 'Recipient form fields are now visible';
      }
      this.refs.recipientEmail.focus();
    } else {
      this.#clearRecipientFields();
      this.#disableRecipientFields();
      if (this.refs.liveRegion) {
        this.refs.liveRegion.textContent = Theme.translations?.recipient_form_fields_hidden || 'Recipient form fields are now hidden';
      }
    }

    this.dispatchEvent(new CustomEvent('recipient:toggle', {
      detail: { mode: this.#currentMode, recipientFormVisible: isRecipientMode },
      bubbles: true,
    }));
  }

  #updateButtonStates(mode) {
    const { DeliveryMode } = GiftCardRecipientForm;
    switch (mode) {
      case DeliveryMode.SELF:
        this.refs.myEmailButton.checked = true;
        this.refs.recipientEmailButton.checked = false;
        break;
      case DeliveryMode.RECIPIENT:
        this.refs.myEmailButton.checked = false;
        this.refs.recipientEmailButton.checked = true;
        break;
      default:
        this.refs.myEmailButton.checked = true;
        this.refs.recipientEmailButton.checked = false;
    }
  }

  #clearRecipientFields() {
    for (const field of this.#inputFields) { field.value = ''; }
    this.#updateCharacterCount();
    this.#clearErrorMessages();
  }

  #disableRecipientFields() {
    for (const field of this.#inputFields) {
      field.disabled = true;
      field.removeAttribute('required');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
    const controlFlag = this.querySelector('input[name="properties[__shopify_send_gift_card_to_recipient]"]');
    if (controlFlag) controlFlag.remove();
    if (this.refs.timezoneOffset) {
      this.refs.timezoneOffset.disabled = true;
      this.refs.timezoneOffset.value = '';
    }
    this.#clearErrorMessages();
  }

  #enableRecipientFields() {
    for (const field of this.#inputFields) {
      field.disabled = false;
      if (field === this.refs.recipientEmail) field.setAttribute('required', 'required');
    }
    let controlFlag = this.querySelector('input[name="properties[__shopify_send_gift_card_to_recipient]"]');
    if (!controlFlag) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'properties[__shopify_send_gift_card_to_recipient]';
      input.value = 'on';
      this.appendChild(input);
    }
    if (this.refs.timezoneOffset) {
      this.refs.timezoneOffset.disabled = false;
      this.refs.timezoneOffset.value = new Date().getTimezoneOffset().toString();
    }
    this.#setDateConstraints();
  }

  #updateCharacterCount() {
    if (!this.refs.characterCount) return;
    const currentLength = this.refs.recipientMessage.value.length;
    const maxLength = this.refs.recipientMessage.maxLength;
    const template = this.refs.characterCount.getAttribute('data-template');
    if (!template) return;
    this.refs.characterCount.textContent = template.replace('[current]', currentLength.toString()).replace('[max]', maxLength.toString());
  }

  #setDateConstraints() {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 90);
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    this.refs.recipientSendOn.setAttribute('min', formatDate(today));
    this.refs.recipientSendOn.setAttribute('max', formatDate(maxDate));
  }

  #displayCartError(event) {
    if (event.detail?.data) {
      const { message, errors, description } = event.detail.data;
      if (errors && typeof errors === 'object') {
        this.#displayErrorMessage(message || 'There was an error', errors);
      } else if (message) {
        this.#displayErrorMessage(message, description);
      }
    }
  }

  #displayErrorMessage(title, body) {
    this.#clearErrorMessages();
    if (typeof body === 'object' && body !== null) {
      const fieldMap = {
        email: { inputRef: 'recipientEmail', errorRef: 'emailError' },
        name: { inputRef: 'recipientName', errorRef: 'nameError' },
        message: { inputRef: 'recipientMessage', errorRef: 'messageError' },
        send_on: { inputRef: 'recipientSendOn', errorRef: 'sendOnError' },
      };
      for (const [field, errorMessages] of Object.entries(body)) {
        const fieldConfig = fieldMap[field];
        if (!fieldConfig) continue;
        const { inputRef, errorRef } = fieldConfig;
        const errorContainer = this.refs[errorRef];
        const inputElement = this.refs[inputRef];
        if (errorContainer instanceof HTMLElement) {
          const errorTextElement = errorContainer.querySelector('span');
          if (errorTextElement) {
            const message = Array.isArray(errorMessages) ? errorMessages.join(', ') : errorMessages;
            errorTextElement.textContent = `${message}.`;
          }
          errorContainer.classList.remove('hidden');
        }
        if (inputElement instanceof HTMLElement) {
          inputElement.setAttribute('aria-invalid', 'true');
          const errorId = `RecipientForm-${field}-error-${this.dataset.sectionId || 'default'}`;
          inputElement.setAttribute('aria-describedby', errorId);
        }
      }
    }
    if (this.refs.liveRegion) {
      this.refs.liveRegion.textContent = title || Theme.translations?.recipient_form_error || 'There was an error with the form submission';
    }
  }

  #clearErrorMessages() {
    for (const errorRef of ['emailError', 'nameError', 'messageError', 'sendOnError']) {
      const errorContainer = this.refs[errorRef];
      if (errorContainer instanceof HTMLElement) {
        errorContainer.classList.add('hidden');
        const el = errorContainer.querySelector('span');
        if (el) el.textContent = '';
      }
    }
    for (const field of this.#inputFields) {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
    if (this.refs.liveRegion) this.refs.liveRegion.textContent = '';
  }

  #handleCartAdd() {
    this.#clearErrorMessages();
  }
}

customElements.define('gift-card-recipient-form', GiftCardRecipientForm);

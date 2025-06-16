/* suggested default style tag:

  <style>
    drag-drop-input input {
      width: 220px;
      font-size: 1.1rem;
      padding: 10px;
      border: 2px solid #007bff;
      border-radius: 6px;
      transition: border-color 0.2s;
    }
    drag-drop-input input.drag-over {
      border-color: #28a745;
      background: #eaffea;
    }
  </style>

To use with Vue 2, e.g. with v-model="mytextval2", 
 be sure to include @input="mytextval2 = $event.target.value"

  */

class DragDropInput extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();
    // Do NOT append children here; wait for connectedCallback!
    this.input = null;
    this._observer = null;
    this._syncing = false;
  }

  connectedCallback() {
    // Find existing input (for Vue/React), or create one
    let maybeInput = this.querySelector('input');
    if (maybeInput) {
      this.input = maybeInput;
    } else if (!this.input) {
      this.input = document.createElement('input');
      this.input.type = 'text';
      this.appendChild(this.input);
    }

    // Add event listeners if not already added
    if (!this.input._dragDropDecorated) {
      // Initial value from attribute (if not already set)
      if (this.hasAttribute('value') && this.input.value !== this.getAttribute('value')) {
        this.input.value = this.getAttribute('value');
      }

      this.input.addEventListener('input', () => {
        this._updateValueFromInput();
      });

      this.input.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.input.classList.add('drag-over');
      });

      this.input.addEventListener('dragleave', () => {
        this.input.classList.remove('drag-over');
      });

      this.input.addEventListener('drop', (e) => {
        e.preventDefault();
        this.input.classList.remove('drag-over');
        let text = e.dataTransfer.getData('text/plain');
        if (!text) text = e.dataTransfer.getData('text');
        if (typeof text === 'string' && text !== this.input.value) {
          this.input.value = text;
          this._updateValueFromInput();
        }
      });

      // Mark as decorated to avoid double listeners
      this.input._dragDropDecorated = true;
    }

    this._forwardAttributes();

    if (!this._observer) {
      this._observer = new MutationObserver(() => this._forwardAttributes());
      this._observer.observe(this, { attributes: true });
    }
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'value' && this.input && !this._syncing) {
      if (this.input.value !== newVal) {
        this.input.value = newVal ?? '';
      }
    }
  }

  _updateValueFromInput() {
    if (this._syncing) return;
    this._syncing = true;
    const value = this.input.value;
    if (this.getAttribute('value') !== value) {
      this.setAttribute('value', value);
    }
    // FIRE input event  Vue 2 should use @input="datext2 = $event.target.value"
    this.dispatchEvent(new Event('input', { bubbles: true }));
    this._syncing = false;
  }

  _forwardAttributes() {
    if (!this.input) return;
    this.input.className = this.className;
    this.input.style.cssText = this.style.cssText;
    const ignored = ['id', 'class', 'style', 'value','@input'];
    Array.from(this.attributes).forEach(attr => {
      if (!ignored.includes(attr.name)) {
        this.input.setAttribute(attr.name, attr.value);
      }
    });
    Array.from(this.input.attributes).forEach(attr => {
      if (!ignored.includes(attr.name) && !this.hasAttribute(attr.name)) {
        this.input.removeAttribute(attr.name);
      }
    });
  }

  // The  .value property
  get value() {
    return this.input ? this.input.value : '';
  }
  set value(val) {
    if (this.input && val !== this.input.value) {
      this.input.value = val ?? '';
      // Do NOT fire input event here (only on user-initiated)
    }
    if (val !== this.getAttribute('value')) {
      this.setAttribute('value', val ?? '');
    }
  }
}

customElements.define('drag-drop-input', DragDropInput);

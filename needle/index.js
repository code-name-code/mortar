/**
 * Stashes values, objects and functions in a window making them available globally.
 *
 * In a customElement use it like this:
 * customElement('my-element', inject({
 *    connectedCallback(){}
 *    ...
 * }))
 *
 * or
 *
 * customElement('my-element', {
 *    __proto__: Injector.bindings(),
 *    connectedCallback(){}
 *    ...
 * });
 *
 * Bound keys are accessbile within element via: super.myKey.
 * 
 * Adding bindings to plain DOM elements, e.g. div:
 * div(bindings(), 'DIV content');
 * div(bindings('key'), 'DIV content');
 */
export default class Injector {
  static INJECTOR_NAMESPACE = 'Injector';

  static create() {
    if (!window[this.INJECTOR_NAMESPACE]) {
      window[this.INJECTOR_NAMESPACE] = Object.create({});
    }
  }

  /**
   * Binds given value to the given key within Injector object.
   * @param {*} key
   * @param {*} value
   */
  static provide(key, value) {
    window[this.INJECTOR_NAMESPACE][key.toLowerCase()] = value;
  }

  static hasKey(key) {
    return !!bindings()[key.toLowerCase()];
  }
}

export const bindings = (...keys) => {
  if (keys.length > 0) {
    let o = {};
    keys.reduce((sub, key) => {
      if (Injector.hasKey(key.toLowerCase())) {
        sub[key.toLowerCase()] =
          window[Injector.INJECTOR_NAMESPACE][key.toLowerCase()];
      }
    }, o);
    return o;
  }
  return window[Injector.INJECTOR_NAMESPACE];
};

export const inject = (customElementPrototype, ...keys) => {
  customElementPrototype.__proto__ = bindings(...keys);
  return customElementPrototype;
};

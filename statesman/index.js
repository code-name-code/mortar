export default class Session {
  static get(key) {
    if (sessionStorage.getItem(key)) {
      return JSON.parse(sessionStorage.getItem(key));
    }
  }

  static set(key, value) {
    let newValue = JSON.stringify(value);
    let oldValue = sessionStorage.getItem(key);

    let storageEvent = new StorageEvent('storage', {
      key: key,
      newValue: newValue,
      oldValue: oldValue,
      storageArea: sessionStorage
    });

    sessionStorage.setItem(key, newValue);

    window.dispatchEvent(storageEvent);
 }

  static remove(key) {
    if (sessionStorage.getItem(key)) {
      let oldValue = sessionStorage.getItem(key);

      let storageEvent = new StorageEvent('storage', {
        key: key,
        oldValue: oldValue,
        storageArea: sessionStorage
      });

      sessionStorage.removeItem(key);

      window.dispatchEvent(storageEvent);
    }
  }

  static clear() {
    sessionStorage.clear();

    window.dispatchEvent(
      new StorageEvent('storage', {
        storageArea: sessionStorage
      })
    );
  }
}

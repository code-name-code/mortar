export default class Router {
  static BLANK_LOCATION = ['', '/'];

  #_outlet;
  #_pageNotFound;
  #_routes;
  #_open;
  #_currentPath;
  #_parentMatch;
  #_onPathChange = new Set();

  constructor() {
    this.#_open = false;
  }

  configure(outlet, pageNotFound, routes, parentMatch) {
    this.#_outlet = outlet;
    this.#_pageNotFound = pageNotFound;
    this.#_routes = routes;
    this.#_parentMatch = parentMatch ?? '';

    this.onHashChange = this.onHashChange.bind(this);

    return this;
  }

  isOpen() {
    return this.#_open;
  }

  open() {
    if (!this.isOpen()) {
      window.addEventListener('hashchange', this.onHashChange);
      this.#_open = true;
      this.onHashChange({});
    }
  }

  close() {
    if (this.isOpen()) {
      window.removeEventListener(
        'hashchange',
        this.onHashChange
      );
      this.#_open = false;
    }
  }

  goTo(path) {
    if (path.startsWith('/')) {
      path = '#' + path;
    } else if (!path.startsWith('#')) {
      path = '#/' + path;
    }
    location.hash = path;
  }

  reload() {
    this.#_currentPath = null;
    this.onHashChange({});
  }

  onHashChange(e) {
    if (!this.isOpen()) {
      return;
    }

    let hashLocation = this.#stripHashLocation(
      window.location.hash.substring(1)
    );

    if (hashLocation.startsWith(this.#_parentMatch)) {
      hashLocation = hashLocation.slice(
        this.#_parentMatch.length
      );
    } else {
      return;
    }

    let match = this.#longestMatchingRoute(hashLocation);
    if (match.redirected) {
      this.#updateHash(match.path);
    }
    if (!this.currentPath || match.path !== this.currentPath) {
      const oldPath = this.#_currentPath;
      this.#_currentPath = match.path;
      this.#onPathChange(oldPath, this.#_currentPath);

      if (!match.destination) {
        this.#flushToOutlet(this.pageNotFound());
        return;
      } else {
        this.#flushToOutlet(match.destination());
      }
    }
  }

  #longestMatchingRoute(startingHashLocation) {
    let hashLocation = startingHashLocation;
    let route;
    do {
      route = this.#resolveRoute(hashLocation);
      if (route.destination) {
        return route;
      }

      hashLocation = hashLocation.substring(
        0,
        hashLocation.lastIndexOf('/')
      );
    } while (hashLocation.length > 0);
    return {};
  }

  #resolveRoute(inputPath) {
    let destination = this.routes[inputPath];
    if (typeof destination === 'string') {
      let result = this.#resolveRoute(destination);
      result.redirected = true;
      return result;
    } else {
      return { path: inputPath, destination: destination };
    }
  }

  #updateHash(targetPath) {
    if (targetPath) {
      let queryParams = this.#stripQueryParams(location.hash);
      let targetHashLocation =
        '#' + this.#_parentMatch + targetPath + queryParams;
      if (location.hash !== targetHashLocation) {
        history.replaceState(null, null, targetHashLocation);
      }
    }
  }

  async #flushToOutlet(module) {
    if (
      typeof module === 'object' &&
      typeof module.then === 'function'
    ) {
      // if Promise
      module = (await module).default();
    }
    document.querySelector('#' + this.outlet).innerHTML = '';
    document.querySelector('#' + this.outlet).append(module);
  }

  #stripHashLocation(hashLocation) {
    let questionMarkIndex = hashLocation.indexOf('?');
    return questionMarkIndex > -1
      ? hashLocation.substring(0, questionMarkIndex)
      : hashLocation;
  }

  #stripQueryParams(hashLocation) {
    let questionMarkIndex = hashLocation.indexOf('?');
    return questionMarkIndex > -1
      ? hashLocation.substring(questionMarkIndex)
      : '';
  }

  getQueryParams() {
    return new URLSearchParams(
      this.#stripQueryParams(location.hash)
    );
  }

  setQueryParams(params, suppressOnHashchange = false) {
    const urlSearchParams = this.getQueryParams();
    for (const key in params) {
      if (params[key] === undefined) {
        urlSearchParams.delete(key);
      } else {
        urlSearchParams.set(key, params[key]);
      }
    }
    const queryParamString = urlSearchParams.toString()
      ? '?' + urlSearchParams.toString()
      : '';
    const newHashLocation =
      this.#stripHashLocation(window.location.hash) +
      queryParamString;
    if (suppressOnHashchange) {
      history.pushState(null, null, newHashLocation);
    } else {
      location.hash = newHashLocation;
    }
  }

  /**
   * Add callback to be invoked when current path in router changes.
   * @param {*} onPathChange
   */
  addOnPathChange(onPathChange) {
    this.#_onPathChange.add(onPathChange);
  }

  removeOnPathChange(onPathChange) {
    this.#_onPathChange.delete(onPathChange);
  }

  isCurrentFullPath(targetPath) {
    const currentFullPath = location.hash.substring(1);
    if (targetPath.startsWith('#')){
      targetPath = targetPath.substring(1);
    }

    return currentFullPath.startsWith(targetPath);
  }

  #onPathChange(oldPath, newPath) {
    this.#_onPathChange.forEach(onPathChange =>
      onPathChange(oldPath, newPath)
    );
  }

  get routes() {
    return this.#_routes;
  }

  get outlet() {
    return this.#_outlet;
  }

  get pageNotFound() {
    return this.#_pageNotFound;
  }

  get currentPath() {
    return this.#_currentPath;
  }
}

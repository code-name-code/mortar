export default class Router {
  static BLANK_LOCATION = ['', '/'];

  #_outlet;
  #_defaultRoutePath;
  #_pageNotFound;
  #_routes;
  #_open;
  #_currentPath;
  #_parentMatch;

  constructor(
    outlet,
    defaultRoutePath,
    pageNotFound,
    routes,
    parentMatch
  ) {
    this.#_open = false;

    this.#_outlet = outlet;
    this.#_defaultRoutePath = defaultRoutePath;
    this.#_pageNotFound = pageNotFound;
    this.#_routes = routes;
    this.#_parentMatch = parentMatch ?? '';

    this.onHashChange = this.onHashChange.bind(this);
  }

  isOpen() {
    return this.#_open;
  }

  open() {
    if (!this.isOpen()) {
      window.addEventListener('hashchange', this.onHashChange);
      this.#_open = true;
      this.deepLink(window.location.hash.substring(1));
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
    if (history.pushState) {
      history.pushState(null, null, '#' + path);
      this.onHashChange({});
    } else {
      location.hash = '#' + path;
    }
  }

  onHashChange(e) {
    if (!this.isOpen()) {
      return;
    }

    let hashLocation = this.stripHashLocation(
      window.location.hash.substring(1)
    );

    let queryParams = this.stripQueryParams(
      window.location.hash.substring(1)
    );

    if (hashLocation.startsWith(this.#_parentMatch)) {
      hashLocation = hashLocation.slice(
        this.#_parentMatch.length
      );
    } else {
      return;
    }

    if (Router.BLANK_LOCATION.includes(hashLocation)) {
      hashLocation = this.defaultRoutePath;
      location.hash = '#' + this.#_parentMatch + hashLocation + queryParams;
    }

    let match = this.longestMatchingRoute(hashLocation);
    if (!this.currentPath || match.path !== this.currentPath) {
      this.#_currentPath = match.path;

      if (!match.route) {
        this.flushToOutlet(this.pageNotFound());
        return;
      } else {
        this.flushToOutlet(match.route());
      }
    }
  }

  longestMatchingRoute(hashLocation) {
    let route;
    do {
      route = this.routes[hashLocation];
      if (route) {
        return { path: hashLocation, route: route };
      }

      hashLocation = hashLocation.substring(
        0,
        hashLocation.lastIndexOf('/')
      );
    } while (hashLocation.length > 0);
    return {};
  }

  async flushToOutlet(module) {
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

  deepLink(uri) {
    let route = this.longestMatchingRoute(
      this.stripHashLocation(uri)
    );
    if (this.defaultRoutePath && !route) {
      this.goTo(this.defaultRoutePath);
    } else {
      this.goTo(uri);
    }
  }

  stripHashLocation(hashLocation) {
    let questionMarkIndex = hashLocation.indexOf('?');
    return questionMarkIndex > -1
      ? hashLocation.substring(0, questionMarkIndex)
      : hashLocation;
  }

  stripQueryParams(hashLocation) {
    let questionMarkIndex = hashLocation.indexOf('?');
    return questionMarkIndex > -1
      ? hashLocation.substring(questionMarkIndex)
      : '';
  }

  getQueryParams() {
    return new URLSearchParams(this.stripQueryParams(
      window.location.hash.substring(1)
    ));
  }

  get routes() {
    return this.#_routes;
  }

  get outlet() {
    return this.#_outlet;
  }

  get defaultRoutePath() {
    return this.#_defaultRoutePath;
  }

  get pageNotFound() {
    return this.#_pageNotFound;
  }

  get currentPath() {
    return this.#_currentPath;
  }
}

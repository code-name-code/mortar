class RouterNode {
  #_outlet;
  #_pageNotFound;
  #_routes;
  #_currentPath;

  constructor(outlet, pageNotFound, routes) {
    this.#_outlet = outlet;
    this.#_pageNotFound = pageNotFound;
    this.#_routes = routes;
  }

  longestMatchingRoute(startingHashLocation) {
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
    let destination = this.#_routes[inputPath];
    if (typeof destination === 'string') {
      let result = this.#resolveRoute(destination);
      result.redirected = true;
      return result;
    } else {
      return { path: inputPath, destination: destination };
    }
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

  get outlet() {
    return this.#_outlet;
  }

  get pageNotFound() {
    return this.#_pageNotFound;
  }

  set currentPath(currentPath) {
    this.#_currentPath = currentPath;
  }

  get currentPath() {
    return this.#_currentPath;
  }
}

class SimpleRouterNode extends RouterNode {
  #_destination;

  constructor(outlet, pageNotFound, destination) {
    super(outlet, pageNotFound);
    this.#_destination = destination;
  }

  longestMatchingRoute() {
    return { path: '', destination: this.#_destination };
  }
}

export default class Router {
  static BLANK_LOCATION = ['', '/'];

  #_onPathChange = new Set();
  #_routerNodes = new Set();
  #_currentFullPath;

  constructor() {
    this.onHashChange = this.onHashChange.bind(this);
    window.addEventListener('hashchange', this.onHashChange);
  }

  configure(outlet, pageNotFound, routes) {
    const routerNode = new RouterNode(
      outlet,
      pageNotFound,
      routes
    );

    this.#_routerNodes.add(routerNode);

    this.onHashChange({});

    return {
      close: () => {
        this.#_routerNodes.delete(routerNode);
      }
    };
  }

  configureSimple(outlet, pageNotFound, destination) {
    const routerNode = new SimpleRouterNode(
      outlet,
      pageNotFound,
      destination
    );

    this.#_routerNodes.add(routerNode);

    this.onHashChange({});

    return {
      close: () => {
        this.#_routerNodes.delete(routerNode);
      }
    };
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
    this.#_routerNodes.forEach(routerNode => {
      routerNode.currentPath = undefined;
    });
    this.onHashChange({});
  }

  onHashChange(e) {
    let parentNode;
    let parentPath = '';

    let hashLocation = this.#stripHashLocation(
      window.location.hash.substring(1)
    );

    this.#_routerNodes.forEach(routerNode => {
      if (parentNode) {
        hashLocation = hashLocation.slice(
          parentNode.currentPath.length
        );
      }

      this.#evaluateRouterNode(
        hashLocation,
        routerNode,
        parentPath
      );

      parentNode = routerNode;
      parentPath += parentNode.currentPath;
    });
  }

  #evaluateRouterNode(hashLocation, routerNode, parentPath) {
    let match = routerNode.longestMatchingRoute(hashLocation);
    if (match.redirected) {
      this.#updateHash(match.path, parentPath);
    }
    if (
      routerNode.currentPath === undefined ||
      match.path !== routerNode.currentPath
    ) {
      routerNode.currentPath = match.path;

      const oldPath = this.#_currentFullPath;
      this.#_currentFullPath = this.#stripHashLocation(
        location.hash.substring(1)
      );
      this.#onPathChange(oldPath, this.#_currentFullPath);

      if (!match.destination) {
        routerNode.flushToOutlet(routerNode.pageNotFound());
        return;
      } else {
        routerNode.flushToOutlet(match.destination());
      }
    }
  }

  #updateHash(targetPath, parentPath) {
    if (targetPath) {
      let queryParams = this.#stripQueryParams(location.hash);
      let targetHashLocation =
        '#' + parentPath + targetPath + queryParams;
      if (location.hash !== targetHashLocation) {
        history.replaceState(null, null, targetHashLocation);
      }
    }
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
    if (targetPath.startsWith('#')) {
      targetPath = targetPath.substring(1);
    }

    return currentFullPath.startsWith(targetPath);
  }

  #onPathChange(oldPath, newPath) {
    this.#_onPathChange.forEach(onPathChange =>
      onPathChange(oldPath, newPath)
    );
  }
}

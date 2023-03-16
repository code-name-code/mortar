import { a } from '../../htmlhammer/index.js';

const configuration = {
  isSet: false,
  gatewayUrl: '',
  defaultOptions: {},
  onError: error => {
    console.error(error);
  },
  defaultNotOk: response => {
    console.error(response);
  }
};

class Summoned {
  #_responsePromise;

  constructor(responsePromise) {
    this.#_responsePromise = responsePromise;
  }

  json(okCb, notOkCb) {
    this.#to('json');
    this.#callbacks(okCb, notOkCb);
    return this;
  }

  text(okCb, notOkCb) {
    this.#to('text');
    this.#callbacks(okCb, notOkCb);
    return this;
  }

  blob(okCb, notOkCb) {
    this.#to('blob');
    this.#addContentDisposition();
    this.#callbacks(okCb, notOkCb);
    return this;
  }

  plain(okCb, notOkCb) {
    this.#to('plain');
    this.#callbacks(okCb, notOkCb);
    return this;
  }

  #to(bodyType) {
    this.#_responsePromise = this.#_responsePromise.then(
      async wrapped => {
        if (!wrapped.error && wrapped.ok) {
          Object.assign(wrapped, {
            response:
              bodyType === 'plain'
                ? wrapped.original.clone()
                : await wrapped.original.clone()[bodyType]()
          });
        }
        return wrapped;
      }
    );
    return this;
  }

  #addContentDisposition() {
    this.#_responsePromise = this.#_responsePromise.then(
      wrapped => {
        if (!wrapped.error && wrapped.ok) {
          wrapped.response.contentDisposition =
            wrapped.original.headers.get('Content-Disposition');
        }
        return wrapped;
      }
    );
    return this;
  }

  #callbacks(okCb, notOkCb) {
    if (okCb) {
      this.ok(okCb);
    }
    if (notOkCb) {
      this.notOk(notOkCb);
    }
  }

  map(mappingFunction) {
    this.#_responsePromise = this.#_responsePromise.then(
      wrapped => {
        if (!wrapped.error && wrapped.ok) {
          Object.assign(wrapped, {
            response: mappingFunction(wrapped.response)
          });
        }
        return wrapped;
      }
    );
    return this;
  }

  ok(cb) {
    this.#_responsePromise = this.#_responsePromise.then(
      wrapped => {
        if (!wrapped.error && wrapped.ok) {
          cb(wrapped.response);
        }
        return wrapped;
      }
    );
    return this;
  }

  notOk(cb) {
    this.#_responsePromise = this.#_responsePromise.then(
      wrapped => {
        if (!wrapped.error && !wrapped.ok) {
          cb(wrapped.response);
        }
        return wrapped;
      }
    );
    return this;
  }

  finally(cb) {
    this.#_responsePromise = this.#_responsePromise.finally(
      wrapped => {
        cb();
        return wrapped;
      }
    );
    return this;
  }
}

const summon = (uri, opts) => {
  const responsePromise = fetch(
    /https?:/.test(uri) ? uri : configuration.gatewayUrl + uri,
    resolveOptions(uri, opts)
  )
    .then(response => ({
      ok: response.ok,
      original: response,
      response: response.clone()
    }))
    .catch(error => {
      opts.supressOnError
        ? () => {}
        : configuration.onError(error);
      return {
        error: true
      };
    });
  return new Summoned(responsePromise).notOk(
    opts.supressDefaultNotOk
      ? () => {}
      : configuration.defaultNotOk
  );
};

const resolveOptions = (uri, opts) => {
  const resolvedOptions = {};
  for (const key in configuration.defaultOptions) {
    if (
      typeof configuration.defaultOptions[key] === 'function'
    ) {
      resolvedOptions[key] = configuration.defaultOptions[key](
        uri,
        opts
      );
    } else {
      resolvedOptions[key] = configuration.defaultOptions[key];
    }
  }
  return Object.assign(resolvedOptions, opts);
};

const prepareOpts = (method, body) => {
  let opts = { method };
  if (
    typeof body === 'object' &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof FormData)
  ) {
    body = JSON.stringify(body);
  }
  opts['body'] = body ? body : undefined;
  return opts;
};

const extractFilename = contentDisposition => {
  let filename = contentDisposition
    .split(/;(.+)/)[1]
    .split(/=(.+)/)[1];
  if (filename.toLowerCase().startsWith("utf-8''"))
    filename = decodeURIComponent(
      filename.replace(/utf-8''/i, '')
    );
  else filename = filename.replace(/['"]/g, '');
  return filename;
};

const GET = (uri, opts = {}) =>
  summon(uri, Object.assign(opts, { method: 'GET' }));

const POST = (uri, body, opts = {}) =>
  summon(uri, Object.assign(opts, prepareOpts('POST', body)));

const PUT = (uri, body, opts = {}) =>
  summon(uri, Object.assign(opts, prepareOpts('PUT', body)));

const DELETE = (uri, opts = {}) =>
  summon(uri, Object.assign(opts, { method: 'DELETE' }));

const download = (uri, opts = {}) => {
  return GET(uri, opts)
    .blob()
    .ok(bytes => {
      const downloadLink = a({
        href: URL.createObjectURL(bytes)
      });
      downloadLink.setAttribute(
        'download',
        extractFilename(bytes.contentDisposition)
      );
      downloadLink.click();
    });
};

const configureSummoner = config => {
  if (!configuration.isSet) {
    Object.assign(configuration, config, { isSet: true });
  }
};

/**
 * Add properties from given params object to url as query parameters.
 * @param {*} url - the given url
 * @param {*} params - the params object. Each propery reprsents a query paramater to be added.
 * @returns url with added query parameters
 */
const addSearchParams = (url, params = {}) => {
  let searchParams = url.searchParams;
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      searchParams.append(key, params[key]);
    }
  }

  url.search = searchParams;
  return url;
};

export {
  GET,
  POST,
  PUT,
  DELETE,
  download,
  configureSummoner,
  configuration,
  addSearchParams
};

const browserFetch = window.fetch;

export default function mockBackend(config) {
  window.fetch = function (
    uri,
    opts = { method: 'GET', headers: new Headers() }
  ) {
    let response;

    for (let entry of config) {
      if (entry.match(uri, opts)) {
        let returned =
          typeof entry.response === 'function'
            ? entry.response(uri, opts)
            : entry.response;
        response = new Response(
          JSON.stringify(returned.body),
          returned.init
        );
        break;
      }
    }

    if (!response) {
      return browserFetch(uri, opts);
    }

    return new Promise(resolve =>
      setTimeout(() => resolve(response), mockBackend.timeout)
    );
  };
}

// For now, global setting of how much each request takes time
mockBackend.timeout = 25;
// Converts uri parameter to regular expression
mockBackend.regexUri = uri => {
  let expression = `^${uri.source}$`;
  return new RegExp(expression);
};

export { browserFetch };

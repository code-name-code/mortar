import { test } from '../inspector/index.js';
import mockBackend from './index.js';

mockBackend([
  {
    // Simple request mapping
    // Response is expressed as a simple json object
    match: (uri, opts) =>
      opts.method === 'GET' && uri.endsWith('/message'),
    response: {
      body: {
        message: 'ok'
      },
      init: {
        status: 200,
        statusText: 'Ok'
      }
    }
  },
  {
    // Request mapping with one query parameter
    // Response is expressed with a function receiving uri parameter
    match: (uri, opts) =>
      opts.method === 'GET' &&
      mockBackend.regexUri(/\/message\?query=.*/).test(uri),
    response: uri => {
      let query = new URL('http://' + uri).searchParams.get(
        'query'
      );
      return {
        body: { query: query },
        init: { status: 200, statusText: 'Ok' }
      };
    }
  }
]);

test.async(done => {
  fetch('/message', { method: 'GET' })
    .then(r => r.json())
    .then(r => {
      test(
        r.message === 'ok',
        'Received message contains property "message" with value "ok"'
      );
      done();
    });
});

test.async(done => {
  fetch('/message?query=ok', { method: 'GET' })
    .then(r => r.json())
    .then(r => {
      test(
        r.query === 'ok',
        'Parses request with query parameter. Received message contains property "query" with value "ok"'
      );
      done();
    });
});

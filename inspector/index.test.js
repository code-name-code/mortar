import {
  test,
  TEST_COUNTER_UPDATE_EVENT_TYPE
} from './index.js';

let ok = 0;
let failed = 0;

document.addEventListener(
  TEST_COUNTER_UPDATE_EVENT_TYPE,
  event => {
    event.detail ? ok++ : failed++;
  }
);

test.assert(
  test.runtime === 'browser',
  'Property test.runtime default value is "browser'
);

test.assert(
  (test.timeout = 5000),
  'Property test.timeout default value is 5000'
);

test.assert(
  test.results instanceof Array && test.results.length === 0,
  'Property test.results default value is an empty array'
);

test.assert(
  (test.title = 'TestGroup'),
  'Property test.title default value is "TestGroup"'
);

test(1 === 1, 'One equals one');
test(1 === 2, 'One does not equal 2');

test.assert(
  ok === 1,
  'TEST_COUNTER_UPDATE_EVENT_TYPE event listener incremented "ok" counter'
);

test.assert(
  failed === 1,
  'TEST_COUNTER_UPDATE_EVENT_TYPE event listener incremented "failed" counter'
);

test.async(done => {
  setTimeout(() => {
    test.assert(
      test.results.filter(result => result).length === 1,
      'Async - test.results holds 1 ok tests'
    );
    test.assert(
      test.results.filter(result => !result).length === 1,
      'Async - test.results holds 1 failed test'
    );
    done();
  }, 1000);
});

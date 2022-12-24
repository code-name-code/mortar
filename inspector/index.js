const TEST_COUNTER_UPDATE_EVENT_TYPE =
  'inspector-counter-update';

/**
 * Executes and asserts test. It also updates tests' counters.
 *
 * @param {*} condition
 * @param {*} message
 * @param {*} addTestResult
 * @returns
 */
function test(condition, message, addTestResult = true) {
  test.console.report(condition, message);
  if (addTestResult) {
    test.addTestResult(condition);
  }
  return new Promise(function (resolve, reject) {
    resolve(condition);
  });
}

/**
 * Same as test but does not update test counters.
 * Use this to assert state without affecting it.
 *
 * @param {*} condition
 * @param {*} message
 * @returns
 */
test.assert = function (condition, message) {
  return test(condition, message, false);
};

/**
 * Executes asynchronous test.
 *
 * @param {*} fn
 * @param {*} timeout
 * @returns
 */
test.async = function (fn, timeout) {
  let timer = setTimeout(function () {
    return test(false, 'timeout ' + fn);
  }, timeout || test.timeout);
  return fn(function () {
    clearTimeout(timer);
  });
};

test.timeout = 5000;
test.runtime = 'browser';
test.id = Math.floor(Math.random() * 9000) + 1000;
test.title = 'TestGroup';
test.results = new Array();
test.addTestResult = function (result) {
  if (test.runtime === 'browser') {
    test.results.push(result);
    document.dispatchEvent(
      new CustomEvent(TEST_COUNTER_UPDATE_EVENT_TYPE, {
        bubbles: true,
        detail: result
      })
    );
  }
};
test.console = {
  report: function (result, message) {
    let c = result ? console.info : console.error;
    let {
      testGroupColor,
      clearColor,
      baseColor,
      okColor,
      failedColor
    } = test.console.colors;
    c(
      `%c[${test.title}-${test.id}]%c %ctest ${
        result ? 'ok' : 'failed'
      }%c %c${message}`,
      testGroupColor.join(';'),
      clearColor,
      result
        ? baseColor.concat(okColor).join(';')
        : baseColor.concat(failedColor).join(';'),
      clearColor,
      baseColor.join(';')
    );
  },
  colors: {
    testGroupColor: [
      'color:white',
      'background-color:' +
        '#' +
        Math.random().toString(16).slice(2, 8)
    ],
    clearColor: [],
    baseColor: [
      'color:white',
      'background-color:#444',
      'padding:4px'
    ],
    okColor: ['color:white', 'background-color:green'],
    failedColor: ['color:white', 'background-color:red']
  }
};

export { test, TEST_COUNTER_UPDATE_EVENT_TYPE };

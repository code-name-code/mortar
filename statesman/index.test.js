import Session from './index.js';
import { test } from '../inspector/index.js';

test.title = 'Statesman';

test.async(done => {
  let listener;
  window.addEventListener(
    'storage',
    (listener = event => {
      if (event.key === 'testKey') {
        test(
          event.newValue === '"testValue"' &&
            event.key === 'testKey',
          'Storage event with correct key and value is fired on Session.set()'
        );
        test(
          Session.get('testKey') === 'testValue',
          'Session.get() retrieves the correct value set by Session.set()'
        );
        window.removeEventListener('storage', listener);
        done();
      }
    })
  );

  Session.set('testKey', 'testValue');
});

Session.set('testKeyInt', 234);
test(
  Session.get('testKeyInt') === 234,
  'Session.get() retrieves the correct Integer value set by Session.set()'
);

Session.set('testKeyDec', 234.12);
test(
  Session.get('testKeyDec') === 234.12,
  'Session.get() retrieves the correct Decimal value set by Session.set()'
);

const testObject = {
  testKeyString: 'testValue',
  testKeyInt: 234
};
Session.set('testKeyObject', testObject);
test(
  Session.get('testKeyObject').testKeyString ===
    testObject.testKeyString &&
    Session.get('testKeyObject').testKeyInt ===
      testObject.testKeyInt,
  'Session.get() retrieves the correct Object value set by Session.set()'
);

Session.set('testKeyOverwrite', 'testValue1');
Session.set('testKeyOverwrite', 'testValue2');

test(
  Session.get('testKeyOverwrite') === 'testValue2',
  'Session.set() correctly overwrites previous value'
);

Session.remove('testKeyOverwrite');
test(
  Session.get('testKeyOverwrite') === undefined &&
    Session.get('testKeyObject') !== undefined,
  'Session.remove() correctly removes the value for the given key but not for other keys'
);

Session.clear();
test(
  Session.get('testKeyDec') === undefined &&
    Session.get('testKeyObject') === undefined &&
    Session.get('testKeyInt') === undefined &&
    Session.get('testKey') === undefined,
  'Session.clear() removes values for all keys previusly set'
);

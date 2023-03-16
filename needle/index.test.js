import { div } from '../../htmlhammer/index.js';
import { test } from '../inspector/index.js';
import Injector, { bindings, inject } from './index.js';

test.title = 'Needle';

Injector.create();
test(
  Injector.INJECTOR_NAMESPACE === 'Injector',
  'Injector NAMESPACE is "Injector"'
);
test(
  bindings() === window[Injector.INJECTOR_NAMESPACE],
  'Injector is a namespace in a window object'
);

Injector.provide('testKey', 'one');
test(Injector.hasKey('testKey'), "'hasKey' method return true");
test(
  bindings().testkey === 'one',
  'Bindings contain key "testkey" with value "one'
);

test(
  inject({}).testkey === 'one',
  "'inject' function should 'copy' Injector binding's to the given object"
);

Injector.provide('testKey2', 'two');
let o = bindings('testkey2');
test(
  o['testkey2'] && o['testkey'] === undefined,
  'Subset of binding'
);

test(
  inject({}, 'testkey2').testkey === undefined,
  "Only 'testkey2' is defined after object inject"
);

let myDiv = div(bindings('testkey2'), 'test');
test(
  myDiv.getAttribute('testkey2') !== undefined,
  "Inject specified binding to the plain elements like 'div'"
);

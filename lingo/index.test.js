import I18n from './index.js';
import { test } from '../inspector/index.js';

test.title = 'Lingo';

const i18n = new I18n();
i18n.translationsURI = './test-resources/translations.tsv';

test.async(done => {
  i18n.setLocale('en').then(async translations => {
    test(
      translations['test-label.hello'] === 'Hello' &&
        i18n.t('test-label.hello') === 'Hello',
      'Translation (en) for test-label.hello is correct.'
    );
    test(
      translations['test-label.sentence'] ===
        'This is a sentence' &&
        i18n.t('test-label.sentence') === 'This is a sentence',
      'Translation (en) for test-label.sentence is correct.'
    );
    await i18n.setLocale('en').then(newTranslations => {
      test(
        translations === newTranslations,
        'Translations stayed the same after locale set to current locale.'
      );
    });
    done();
  });
});

test.async(done => {
  i18n.setLocale('hr').then(translations => {
    test(
      translations['test-label.hello'] === 'Pozdrav' &&
        i18n.t('test-label.hello') === 'Pozdrav',
      'Translation (hr) for test-label.hello is correct.'
    );
    test(
      translations['test-label.sentence'] ===
        'Ovo je rečenica' &&
        i18n.t('test-label.sentence') === 'Ovo je rečenica',
      'Translation (hr) for test-label.sentence is correct.'
    );
    done();
  });
});

test.async(done => {
  i18n
    .setLocale(false)
    .catch(() => {
      test(true, 'Invalid locale rejected');
      done();
    });
});

i18n.setDefaultLocale("hr");
test(i18n.defaultLocale === "hr", "Retrieved default locale is the one set with i18n.setDefaultLocale()");

test.async(done => {
  i18n
    .setLocale("unsupportedLocale")
    .catch(() => {
      test(true, 'Unsupported locale threw exception');
      done();
    });
});
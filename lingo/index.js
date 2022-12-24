const SET_LOCALE_EVENT = 'i18n-locale-set';

export { SET_LOCALE_EVENT };

export default class I18n {
  #_defaultLocale;
  #_currentLocale;
  #_translationsURI;
  #_translations;
  #_supportedLocales;

  constructor() {}

  /**
   * Call to get value for the given key for the current locale.
   * @param {number} key
   */
  t(key) {
    return this.translations[key];
  }

  /**
   * Set the default locale.
   * @param locale
   */
  setDefaultLocale(locale) {
    this.#_defaultLocale = locale;
  }

  /**
   * Upon successful execution, a Promise is returned containing locale translations object.
   * You can use this to react on locale change e.g. reload component to refresh labels etc.
   *
   * @param locale
   * @returns {Promise<unknown>}
   */
  setLocale(locale) {
    return new Promise(async (resolve, reject) => {
      if (!locale) {
        reject();
      } else if (locale === this.currentLocale) {
        resolve(this.translations);
      } else {
        try {
          let response = await fetch(`${this.translationsURI}`);
          let translations = await response.text();

          this.#_supportedLocales =
            this.#getSupportedLocales(translations);

          this.#_translations = this.#getLocaleTranslations(
            locale,
            translations
          );
          this.#_currentLocale = locale;

          let event = new CustomEvent(SET_LOCALE_EVENT, {
            detail: { newLocale: this.#_currentLocale }
          });
          window.dispatchEvent(event);

          resolve(this.#_translations);
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  #getLocaleTranslations(locale, tsv) {
    let lines = tsv.split('\n');

    // Assume first line is a header
    // TSV values are separated by tab char
    let headers = lines[0].trim().split('\t');

    let localeColumnIndex = headers.indexOf(locale);

    if (localeColumnIndex < 0) {
      throw `${locale} isn't a valid locale!`;
    }

    let translations = Object.create({});

    // Skip first line (it is a header)
    for (let i = 1; i < lines.length; i++) {
      let columns = lines[i].trim().split('\t');
      let key = columns[0];
      translations[key] = columns[localeColumnIndex];
    }

    return translations;
  }

  #getSupportedLocales(tsv) {
    let result = [];
    let lines = tsv.split('\n');

    // Assume first line is a header
    // TSV values are separated by tab char
    let codes = lines[0].trim().split('\t');
    let names = lines
      .filter(line =>
        line.startsWith('dit-csp.label.full-name')
      )[0]
      .trim()
      .split('\t');

    for (let i = 1; i < codes.length; i++) {
      let locale = { code: codes[i], name: names[i] };
      result.push(locale);
    }

    return result;
  }

  get translations() {
    return this.#_translations;
  }

  get supportedLocales() {
    return this.#_supportedLocales;
  }

  get defaultLocale() {
    return this.#_defaultLocale;
  }

  get currentLocale() {
    return this.#_currentLocale;
  }

  get translationsURI() {
    return this.#_translationsURI;
  }

  set translationsURI(uri) {
    this.#_translationsURI = uri;
  }
}

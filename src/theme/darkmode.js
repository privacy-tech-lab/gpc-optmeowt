/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
darkmode.js
================================================================================
darkmode.js is a snippet of code based on the `darkmode.js` source file 
located at https://github.com/sandoche/Darkmode.js/blob/master/src/darkmode.js

darkmode.js implements a way to store the darkmode option in local storage and
only keeps one class that is appended to the HTML body on toggle. All CSS is 
applied via `dark-mode.css` and the `darkmode--activated` attribute.

GitHub Repo: https://github.com/sandoche/Darkmode.js
*/


export const IS_BROWSER = typeof window !== 'undefined';

export default class Darkmode {
  constructor(options) {
    if (!IS_BROWSER) {
      return;
    }

    const defaultOptions = {
      saveInCookies: true,
      autoMatchOsTheme: true
    };

    options = Object.assign({}, defaultOptions, options);

    const preferedThemeOs =
      options.autoMatchOsTheme &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkmodeActivated =
      window.localStorage.getItem('darkmode') === 'true';
    const darkmodeNeverActivatedByAction =
      window.localStorage.getItem('darkmode') === null;

    if (
      (darkmodeActivated === true && options.saveInCookies) ||
      (darkmodeNeverActivatedByAction && preferedThemeOs)
    ) {
      document.body.classList.add('darkmode--activated');
    }
  }

  toggle() {
    if (!IS_BROWSER) {
      return;
    }
    const isDarkmode = this.isActivated();

    document.body.classList.toggle('darkmode--activated');
    window.localStorage.setItem('darkmode', !isDarkmode);
  }

  isActivated() {
    if (!IS_BROWSER) {
      return null;
    }
    return document.body.classList.contains('darkmode--activated');
  }
}

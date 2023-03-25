# Architecture Overview

```txt
src
├── assets       # Static images & files
├── background      # Manages the background script processes
│   ├── protection
│   │   ├── background.js
│   │   ├── cookiesOnInstall.js
│   │   ├── listeners-chrome.js
│   │   ├── listeners-firefox.js
│   │   ├── protection.js
│   │   └── protection-ff.js
│   ├── control.js
│   ├── cookiesIAB.js
│   ├── storage.js
│   └── storageCookies.js
├── common       # Manages header sending and rules
│   ├── editDomainlist.js
│   └── editRules.js
├── content-scripts     # Runs processes on site on adds DOM signal
│   ├── injection
│   │   └── gpc-dom.js
│   ├── registration
│   │   └── gpc-dom.js
│   └── contentScript.js
├── data       # Stores constant data (DNS signals, settings, etc.)
│   ├── cookie_list.js
│   ├── defaultSettings.js
│   ├── headers.js
│   └── regex.js
├── manifests      # Stores manifests
│   ├── chrome
│   │   ├── manifest-dev.json
│   │   └── manifest-dist.json
│   ├── firefox
│   │   ├── manifest-dev.json
│   │   └── manifest-dist.json
├── options       # Options page frontend
│   ├── components
│   │   ├── scaffold-component.html
│   │   └── util.js
│   ├── views
│   │   ├── about-view
│   │   │   ├── about-view.html
│   │   │   └── about-view.js
│   │   ├── domainlist-view
│   │   │   ├── domainlist-view.html
│   │   │   └── domainlist-view.js
│   │   ├── main-view
│   │   │   ├── main-view.html
│   │   │   └── main-view.js
│   │   └── settings-view
│   │       ├── settings-view.html
│   │       └── settings-view.js
│   ├── dark-mode.css
│   ├── options.html
│   ├── options.js
│   └── styles.css
├── popup       # Popup page frontend
│   ├── popup.html
│   ├── popup.js
│   └── styles.css
├── rules       # Manages universal rules
│   ├── gpc_exceptions_rules.json
│   └── universal_gpc_rules.json
└── theme       # Contains darkmode
    └── darkmode.js
test
└── background
    ├── gpc.test.js
    ├── isValidSignalIAB.test.js
    ├── makeCookieIAB.test.js
    ├── pruneCookieIAB.test.js
    └── pruneIABtest.js
```

The following source folders have detailed descriptions further in the document.

[background](#background)\
[common](#common)\
[content-scripts](#content-scripts)\
[data](#data)\
[manifests](#manifests)\
[options](#options)\
[popup](#popup)\
[rules](#rules)\
[theme](#theme)

## background

1. `protection`
2. `control.js`
3. `cookiesIAB.js`
4. `storage.js`
5. `storageCookies.js`

### `src/background/protection`

1. `background.js`
2. `cookiesOnInstall.js`
3. `listeners-chrome.js`
4. `listeners-firefox.js`
5. `protection.js`
6. `protection-ff.js`

#### `protection/background.js`

Initializes the protection mode cookies and listeners.

#### `protection/cookiesOnInstall.js`

Sets opt-out cookies for specific sites.

#### `protection/listeners-chrome.js` and `protection/listeners-firefox.js`

Creates listeners for Chrome and Firefox, respectively.

#### `protection/protection.js`

Manages the domain list with functions like `logData();`, `updateDomainlistAndSignal();`, `pullToDomainlistCache();`, `syncDomainlists();`. Also responsible for supplying the popup with the proper information with `dataToPopup();`. Also creates listeners to watch the popup for domain list changes.

#### `protection/protection-ff.js`

Manages the domain list for Firefox.

### `background/control.js`

Uses `protection.js` to turn the extension on and off.

### `background/cookiesIAB.js`

Is responsible for setting valid IAB cookies.

### `background/storage.js`

Handles storage uploads and downloads.

### `background/storageCookies.js`

Handles cookie creation and deletion.

## common

1. `editDomainlist.js`
2. `editRules.js`

This folder holds common internal API's to be used throughout the extension.

### `common/editDomainlist.js`

Is an internal API to be used for editing a users domain list.

### `common/editRules.js`

Is an internal API to be used for editing rules that allow us to send the GPC header.

## content-scripts

1. `injection`
2. `registration`
3. `contentScript.js`

This folder contains our main content script and methods for injecting the GPC signal into the DOM.

### `src/content-scripts/injection`

1. `gpc-dom.js`

`gpc-dom.js` injects the DOM signal.

### `src/content-scripts/registration`

1. `gpc-dom.js`

This file injects `injection/gpc-dom.js` into the page using a static script. (Based on [this stack overflow thread](https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions))

### `content-scripts/contentScript.js`

This runs on every page and sends information to signal background processes.

## data

1. `cookie_list.js`
2. `defaultSettings.js`
3. `headers.js`
4. `regex.js`

This folder contains static data.

### `data/cookie_list.js`

Contains opt out cookies that are set on install.

### `data/defaultSettings.js`

Contains the default OptMeowt settings.

### `data/headers.js`

Contains the default headers to be attached to online requests.

### `data/regex.js`

Contains regular expressions for finding "do not sell" links and relevant cookies

## manifests

1. `chrome`
2. `firefox`

Contains the extension manifests

### `manifests/chrome`

1. `manifest-dev.json`
2. `manifest-dist.json`

Contains the development and distribution manifests for Chrome

### `manifests/firefox`

1. `manifest-dev.json`
2. `manifest-dist.json`

Contains the development and distribution manifests for Firefox

## options

1. `components`
2. `views`
3. `dark-mode.css`
4. `options.html`

This folder contains all of the frontend code

### `options/components`

1. `scaffold-component.html`
2. `util.js`

This folder contains the basic layout of every options page and helper functions to help render the pages.

### `options/views`

1. `about-view`
2. `domainlist-view`
3. `main-view`
4. `settings-view`

Contains all frontend and implementation of the settings pages.

#### `views/about-view`

1. `about-view.html`
2. `about-view.js`

Builds the "about" page

#### `views/domainlist-view`

1. `domainlist-view.html`
2. `domainlist-view.js`

Builds the domain list page

#### `views/main-view`

1. `main-view.html`
2. `main-view.js`

Builds the main options page

#### `views/settings-view`

1. `settings-view.html`
2. `settings-view.js`

Builds the settings page

### `options/dark-mode.css`

Contains the dark-mode styles for OptMeowt.

### `options/options.html` and `options/options.js`

Is the entry point for the main options page.

### `options/styles.css`

Contains the basic styles for OptMeowt.

## popup

1. `popup.html`
2. `popup.js`
3. `styles.css`

Contains the frontend and implementation for the OptMeowt popup.

## rules

1. `gpc_exception_rules.json`
2. `universal_gpc_rules.json`

Contains rule framework for sending GPC headers to sites.

## theme

1. `darkmode.js`

Contains the dark mode functionality.

**Links to APIs:**

Chrome: [webRequest](https://developer.chrome.com/docs/extensions/reference/webRequest/) and [webNavigation](https://developer.chrome.com/docs/extensions/reference/webNavigation/)

Firefox: [webRequest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest) and [webNavigation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation)

# Architecture Overview

**NOTE: This file has been updated as of 07/06/2022 and it is possible changes have been made since then**

```
src
├── assets							# Static images & files
├── background						# Manages the background script processes
│   ├── analysis
│   │   ├── analysis-listeners.js
│   │   ├── analysis.js
│   │   ├── background.js
│   │   └── injectScript.js
│   ├── protection
│   │   ├── listeners-chrome.js
│   │   ├── listeners-firefox.js
│   │   ├── protection.js
│   │   ├── protection-ff.js
│   │   ├── background.js
│   │   └── cookiesOnInstall.js
│   ├── control.js
│   ├── cookiesIAB.js
│   ├── storage.js
│   └── storageCookies.js
├── common							# Manages header sending and rules
│   ├── csvGenerator.js
│   ├── editDomainlist.js
│   └── editRules.js
├── content-scripts					# Runs processes on site on adds DOM signal
│   ├── injection
│   │   ├── gpc-dom.js
│   │   └── gpc-remove.js
│   ├── registration
│   │   ├── gpc-dom.js
│   │   └── gpc-remove.js
│   └── contentScript.js
├── data							# Stores constant data (DNS signals, settings, etc.)
│   ├── cookie_list.js
│   ├── defaultSettings.js
│   ├── headers.js
│   ├── modes.js
│   ├── privacyFlags.js
│   └── regex.js
├── manifests						# Stores manifests
│   ├── chrome
│   │   ├── manifest-dev.json
│   │   └── manifest-dist.json
│   ├── firefox
│   │   ├── manifest-dev.json
│   │   └── manifest-dist.json
├── options							# Options page frontend
│   ├── components
│   │   ├── scaffold-component.html
│   │   └── util.js
│   ├── views
│   │   ├── about-view
│   │   │   ├── about-view.html
│   │   │   └── about-view.js
│   │   ├── analysis-view
│   │   │   ├── analysis-view.html
│   │   │   └── analysis-view.js
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
│   └──styles.css
├── popup							# Popup page frontend
│   ├── popup.html
│   ├── popup.js
│   └── styles.css
├── rules							# Manages universal rules
│   ├── gpc_exceptions_rules.json
│   └── universal_gpc_rules.json
└── theme							# Contains darkmode
    └── darkmode.js
```


The following folders have detailed descriptions further in the document. 

[src/background]()\
[src/common]()\
[src/content-scripts]()\
[src/data]()\
[src/options]()\
[src/popup]()\
[src/rules]()\
[src/theme]()


<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->

# `src/background` Roadmap

1) `analysis`
2) `protection`
3) `control.js`
4) `cookiesIAB.js`
5) `storage.js`
6) `storageCookies.js`

The background folder splits into the `analysis` and `protection` folders that build the respective modes.

## `src/background/analysis`

1) `analysis-listeners.js` 
2) `analysis.js`
3) `background.js`
4) `injectScript.js`

### `analysis/analysis-listeners.js`

Initializes the listeners for analysis mode using `webRequest` and `webNavigation` (links found below). This file only needs to deal with firefox listeners as analysis mode is not available on Chrome.

### `analysis/analysis.js`

Contains all the logic and processes for running analysis mode. `FetchUSPCookies();` is used to identify and save US Privacy cookies and `fetchUSPAPIData();` uses the USPAPI query to check the US Privacy string. `runAnalysis();` collects the US Privacy values and sends the GPC signal. `haltAnalysis();` then rechecks the US Privacy values and removes the GPC signal, then allowing the US Privacy Values from before and after to be compared. `logData();` then records the found data to local storage.

## `src/background/protection`

1) `background.js`
2) `cookiesOnInstall.js`
3) `listeners-chrome.js`
4) `listeners-firefox.js`
5) `protection.js`
6) `protection-ff.js`

### `protection/background.js`

Initializes the protection mode cookies and listeners.

### `protection/cookiesOnInstall.js`

Sets opt-out cookies for specific sites.

### `protection/listeners-chrome.js` and `protection/listeners-firefox.js`

Creates listeners for chrome and firefox, respectively.

### `protection/protection.js`

Manages the domain list with functions like `logData();`, `updateDomainlistAndSignal();`, `pullToDomainlistCache();`, `syncDomainlists();`. Also responsible for supplying the popup with the proper information with `dataToPopup();`. Also creates listeners to watch the popup for domain list changes.

### `protection/protection-ff.js`

Manages the domain list for firefox.

## `background/control.js`

Uses `analysis.js` and `protection.js` to switch between modes.

## `background/cookiesIAB.js` 

Is responsible for setting valid IAB cookies.

## `background/storage.js`

Handles storage uploads and downloads.

## `background/storageCookies.js`

Handles cookie creation and deletion.

# `src/common` Roadmap

1) `csvGenerator.js`
2) `editDomainlist.js`
3) `editRules.js`

This folder holds common internal API's to be used throughout the extension.

## `common/csvGenerator.js`

Creates a CSV file of the users local collected data.

## `common/editDomainlist.js`

Is an internal API to be used for editing a users domain list.

## `common/editRules.js`

Is an internal API to be used for editing rules that allow us to send the GPC header.

# `src/content-scripts` Roadmap

1) `injection`
2) `registration`
3) `contentScript.js`

This folder contains our main content script and methods for injecting the GPC signal into the DOM.

## `src/content-scripts/injection`

1) `gpc-dom.js`
2) `gpc-remove.js`

`gpc-dom.js` the GPC DOM signal and `gpc-remove.js` removes it.

## `src/content-scripts/registration`

1) `gpc-dom.js`
2) `gpc-remove.js`

These files inject `injection/gpc-dom.js` and `injection/gpc-remove.js` into the page using a static script. (Based on [this stack overflow thread](https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions))

## `content-scripts/contentScript.js`

This runs on every page and sends information to signal background processes.

# `src/data`

1) `cookies.js`
2) `defaultSettings.js`
3) `headers.js`
4) `modes.js`
5) `privacyFlags.js`
6) `regex.js`

This folder contains static data.

## `data/cookies.js`

Contains opt out cookies that are set on install.

## `data/defaultSettings.js`

Contains the default OptMeowt settings.

## `data/headers.js`

Contains the default headers to be attached to online requests.

## `data/modes.js`

Contains the modes for OptMeowt.

## `data/privacyFlags.js`

Contains all privacy flags for analysis

## `data/regex.js`

Contains regular expressions for finding "do not sell" links and relevant cookies

# `src/manifests`

1) `chrome`
2) `firefox`

Contains the extension manifests

## `manifests/chrome`

1) `manifest-dev.json`
2) `manifest-dist.json`

Contains the development and distribution manifests for chrome

## `manifests/firefox`

1) `manifest-dev.json`
2) `manifest-dist.json`

Contains the development and distribution manifests for firefox

# `src/options`

1) `components`
2) `views`
3) `dark-mode.css`
4) `options.html`

This folder contains all of the frontend code

## `options/components`

1) `scaffold-component.html`
2) `util.js`

This folder contains the basic layout of every options page and helper functions to help render the pages.

## `options/views`

1) `about-view`
2) `analysis-view`
3) `domainlist-view`
4) `main-view`
5) `settings-view`

Contains all frontend and implementation of the settings pages.

### `views/about-view`

1) `about-view.html`
2) `about-view.js`

Builds the "about" page

### `views/analysis-view`

1) `analysis-view.html`
2) `analysis-view.js`

Builds the analysis list page

### `views/domainlist-view`

1) `domainlist-view.html`
2) `domainlist-view.js`

Builds the domain list page

### `views/main-view`

1) `main-view.html`
2) `main-view.js`

Builds the main options page

### `views/settings-view`

1) `settings-view.html`
2) `settings-view.js`

Builds the settings page

## `options/dark-mode.css`

Contains the dark-mode styles for OptMeowt.

## `options/options.html` and `options/options.js`

Is the entry point for the main options page.

## `options/styles.css`

Contains the basic styles for OptMeowt.

# `src/popup`

1) `popup.html`
2) `popup.js`
3) `styles.css`

Contains the frontend and implementation for the OptMeowt popup.

# `src/rules`

1) `gpc_exception_rules.json`
2) `universal_gpc_rules.json`

Contains rule framework for sending GPC headers to sites.

# `src/theme`

1) `darkmode.js`

Contains the dark mode functionality.

**Links to APIs:**

Chrome: [webRequest](https://developer.chrome.com/docs/extensions/reference/webRequest/) and [webNavigation](https://developer.chrome.com/docs/extensions/reference/webNavigation/)

Firefox: [webRequest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest) and [webNavigation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation)


<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->

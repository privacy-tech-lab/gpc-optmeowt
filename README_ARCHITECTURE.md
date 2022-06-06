# Architecture Overview

**NOTE: This file is unfinished! It is missing large pieces of information regarding OptMeowt**

```
src
├── assets							# Static images & files
├── background						# Manages the background script processes
│   ├── background.js
│   ├── contentScript.js
│   ├── cookiesIAB.js
│   ├── cookiesOnInstall.js
│   ├── dom.js
│   ├── events.js
│   ├── listeners-chrome.js
│   ├── listeners-firefox.js
│   ├── storage.js
│   └── storageCookies.js
├── data							# Stores constant data (DNS signals, settings, etc.)
│   ├── cookie_list.js
│   ├── defaultSettings.js
│   ├── headers.js
│   └── privacyFlags.js
├── manifest-dev.json
├── manifest-dist.json
├── options							# Options page frontend
│   ├── components
│   │   ├── scaffold-component.html
│   │   └── util.js
│   ├── dark-mode.css
│   ├── options.html
│   ├── options.js
│   ├── styles.css
│   └── views
│       ├── about-view
│       │   ├── about-view.html
│       │   └── about-view.js
│       ├── domainlist-view
│       │   ├── domainlist-view.html
│       │   └── domainlist-view.js
│       ├── main-view
│       │   ├── main-view.html
│       │   └── main-view.js
│       └── settings-view
│           ├── settings-view.html
│           └── settings-view.js
├── popup							# Popup page frontend
│   ├── popup.html
│   ├── popup.js
│   └── styles.css
└── theme							# Contains darkmode
    └── darkmode.js
```


The following folders have detailed descriptions further in the document. 

[src/background]()\
[src/data]()\
[src/options]()\
[src/popup]()\

The extension architecture (background scripts vs. popup vs. options page and their interaction) as well as the build process (Webpack and entry points) are described here.

**High-level picture**

<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->

# `src/background` Roadmap

1) `background.html`
2) `background.js`
3) `contentScript.js`
4) `dom.js`
5) `domainlist.js`
6) `events.js`
7) `headers.js`
8) `storage.js`

## `background.html`

Runs all background scripts

1) `background.js` as *module*

## `background.js`

Most of the functionality of OptMeowt is taken care of here. At a very high level, `background.js` establishes (4) listeners that handle sub-functionality dependent on how a user navigates the web. The listeners' functionality are defined in `events.js`. It also defines how the extension is **enabled** via an enable function that initializes the remainder of the functionality. The listeners (one set for Chrome, one for Firefox) are:

1) `chrome.webRequest.onBeforeSendHeaders`: sends *headers*
2) `chrome.webRequest.onHeadersReceived`:
3) `chrome.webNavigation.onBeforeNavigate`:
4) `chrome.webNavigation.onCommitted`: attaches *dom signal*

These implement functions of the same API name from `events.js`.

**Links to APIs:**

Chrome: [webRequest](https://developer.chrome.com/docs/extensions/reference/webRequest/) and [webNavigation](https://developer.chrome.com/docs/extensions/reference/webNavigation/)

Firefox: [webRequest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest) and [webNavigation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation)

**Imports:**

1) `events.js`
2) `storage.js`
3) `domainlist.js`

## `contentScript.js`

Currently does nothing. It's in here so we don't forget to implement it.

## `dom.js`

Attaches the DOM signal to pages approved for our signals. This file gets initialized via a `chrome.tabs.executeScript` call from `events.js` when necessary.

Currently, this is broken for Chrome.

NOTE: this can potentially be converted into a content script.

## `domainlist.js`

Generally to be used with `async` / `await` syntax (i.e. `await initDomainlist()`), all functions return data via promises (though not all contain important info). The idea is to allow simple domain list calls everywhere in the extension

**imports** `storage.js`

**Exports:**

1) `initDomainlist()`: initializes the domain list with an empty *object* in storage
2) `getDomainlist()`: returns DOMAINLIST from storage as an *object*
3) `getFromDomainlist(domainkey)`: returns DOMAINLIST[domainkey] from storage as a *bool* (i.e., setting for your domain)
4) `addToDomainlist(domainkey)`: sets DOMAINLIST[domainkey] to *true*
5) `removeFromDomainlist(domainkey)`: sets DOMAINLIST[domainkey] to *false*
6) `permRemoveFromDomainlist(domainkey)`: removes DOMAINLIST[domainkey] from DOMAINLIST

## `events.js`

Implements the functionality used by the listeners for Chrome and Firefox in `background.js`. Exports only those select functions. A variety of functions exist in here that are unused, currently they are mostly to remind us to implement them. The ones written in here are implemented.

NOTE: `details` is a javascript object, usually following the format of returned data according to each listener it's associated with. More info in the associated API documentation.

1) `onBeforeSendHeaders(details)`: calls `addHeaders`
2) `onHeadersReceived(details)`: *to be implemented ...*
3) `onBeforeNavigate(details)`: *to be implemented ...*
4) `onCommitted(details)`: calls `addDomSignal`
5) `addHeaders(details)`: attaches all headers defined in `headers.js` to a given call, returns `requestHeaders` *object* from *details*
6) `addDomSignal(details)`: attaches DOM property to site per given call via `dom.js`

**imports** `headers.js`

**Exports:**

1) `onBeforeSendHeaders(details)`
2) `onHeadersReceived(details)`
3) `onBeforeNavigate(details)`
4) `onCommitted(details)`

## `headers.js`

**Exports:**

*object* `headers`: Contains all headers to be attached per approved request (via `addHeaders` in `events.js`)

## `storage.js`

**Exports:**

1) `setToStorage(data)`: *data* is information to be stored wrapped in an *object*
2) `getFromStorage(key)`: *key* is a *string*

<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
<!-- /////////////////////////////////////////////////////////////////////// -->
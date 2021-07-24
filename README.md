<p align="center">
  <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/privacy-tech-lab/optmeowt-browser-extension">
  <img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/privacy-tech-lab/optmeowt-browser-extension">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/privacy-tech-lab/optmeowt-browser-extension">
  <img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/privacy-tech-lab/optmeowt-browser-extension">
  <img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed-raw/privacy-tech-lab/optmeowt-browser-extension">
  <img alt="GitHub" src="https://img.shields.io/github/license/privacy-tech-lab/optmeowt-browser-extension">
  <img alt="GitHub watchers" src="https://img.shields.io/github/watchers/privacy-tech-lab/optmeowt-browser-extension?style=social">
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/privacy-tech-lab/optmeowt-browser-extension?style=social">
  <img alt="GitHub forks" src="https://img.shields.io/github/forks/privacy-tech-lab/optmeowt-browser-extension?style=social">
</p>
  
<br>

<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/issue-19/src/assets/cat-w-text/optmeow-logo-circle.png" width="150px" height="150px" alt="OptMeowt logo">
</p>

# OptMeowt 🐾

OptMeowt ("Opt Me Out") is a browser extension for opting you out from web tracking. OptMeowt works by sending Do Not Sell signals to visited websites per the [Global Privacy Control spec](https://globalprivacycontrol.github.io/gpc-spec/) and placing opt out cookies.

<p align="center">
  <a href="https://addons.mozilla.org/en-US/firefox/addon/optmeowt/"><img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/main/firefox-add-ons-badge.png" width="172px" alt="Firefox Add Ons badge"></a>
  <a href="https://chrome.google.com/webstore/detail/optmeowt/hdbnkdbhglahihjdbodmfefogcjbpgbo"><img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/main/chrome-web-store-badge.png" width="200px" alt="Chrome Web Store badge"></a>
<p>

## How does OptMeowt work?

OptMeowt sends Do Not Sell signals to all sites you visit when browsing the web. Such signals must be respected for California consumers per the California Consumer Privacy Act (CCPA), [Regs Section 999.315(d)](https://oag.ca.gov/sites/all/files/agweb/pdfs/privacy/oal-sub-final-text-of-regs.pdf). Some companies also respect such signals when they are sent from outside of California. OptMeowt also places opt out cookies.

In detail, OptMeowt uses five methods to opt you out:

1. An HTTP Do Not Sell header and JS property we are developing [at the W3C](https://github.com/privacycg/proposals/issues/10).
2. The [DNT header](https://www.w3.org/TR/tracking-dnt/).
3. The [IAB CCPA Compliance Framework for Publishers & Technology Companies](https://iabtechlab.com/standards/ccpa/), implemented in a first party cookie.
4. Third party cookies of ad networks participating in the [DAA's CCPA Opt Out Tool for the Web](https://digitaladvertisingalliance.org/integrate-webchoices-ccpa).
5. Custom headers and cookies used by individual websites maintained and updated in OptMeowt's Do Not Sell list.

**Customizing which Sites Receive Do Not Sell Signals**
For every website you visit OptMeowt will automatically add its domain to the `domain list` meaning that the domain will receive a Do Not Sell signal. However, you can exclude domains that should not receive a Do Not Sell signal. This functionality is available on OptMeowt's settings page that you can access from OptMeowt's popup window.

## Installing and Running OptMeowt from Source on Chromium-based Browsers

1. Clone this repo or download a zipped copy and unzip it.
2. Follow [these steps](https://www.npmjs.com/get-npm) to install npm.
3. Install the Grunt command line tool and run in your terminal\
   `npm install -g grunt-cli`
4. Then, run:\
   `cd optmeowt-browser-extension`\
   `npm i grunt`
5. In your browser, navigate to the extensions page at `chrome://extensions/`.
6. Enable `Developer mode` with the slider on the top right corner of the extension page.
7. Click the `Load unpacked` button in the top left of the page.
8. Navigate to where you unzipped the OptMeowt folder and open up the `src` folder.\
   **Note:** You do not need to click on the `manifest.json` file in Chrome, though other browsers may require this.
9. Click to finalize the install.

Please note that OptMeowt is in active development and new features are frequently added, some of which may cause errors. You can always get the stable release version on the [Chrome Web Store](https://chrome.google.com/webstore/detail/optmeowt/hdbnkdbhglahihjdbodmfefogcjbpgbo) and on [Firefox Add-Ons](https://addons.mozilla.org/en-US/firefox/addon/optmeowt/).

## OptMeowt's Permission Use

We do not collect any data from you. Third parties will also not receive your data. The permissions OptMeowt is using are required for opting you out. OptMeowt uses the following permissions:

```json
"permissions": [
    "webRequest",
    "<all_urls>",
    "webRequestBlocking",
    "webNavigation",
    "storage",
    "activeTab",
    "cookies",
    "tabs"
  ]
```

- `webRequest`: Pauses outgoing HTTP requests to append opt out headers
- `<all_urls>`: Allows modification of outgoing HTTP requests
- `webRequestBlocking`: Necessary for pausing outgoing HTTP requests
- `webNavigation`: Similar to `webRequest`, allows OptMeowt to check when navigation requests are made to reset processes
- `storage`: Allows OptMeowt to save your opt out preferences in your browser
- `activeTab`: Allows OptMeowt to set opt out signals on your active browser tab
- `cookies`: Allows OptMeowt to place opt out cookies in your browser
- `tabs`: Allows OptMeowt to keep track of HTTP headers per tab to show you the opt out status of the current site in a popup

## Directories in this Repo

- `src/`: Main contents of the OptMeowt browser extension.
- `src/assets`: Graphical elements of the extension, including logos and button images.
- `src/background`: Listeners for events and logic for placing cookies.
- `src/data`: Definitions of headers, cookies, and privacy flags.
- `src/options`: UI elements and scripts for the supplemental options page.
- `src/popup`: UI elements and scripts for the popup inside the extensions bar.
- `ui-mockup`: Contains PDF and XD files demonstrating the preliminary mockup and analysis of OptMeowt.

## Third Party Libraries

OptMeowt uses the following third party libraries. We thank the developers.

- [animate.css](https://github.com/animate-css/animate.css)
- [Dark Mode Switch](https://github.com/coliff/dark-mode-switch)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [mustache.js](https://github.com/janl/mustache.js)
- [popper.js](https://github.com/popperjs/popper-core)
- [psl (Public Suffix List)](https://github.com/lupomontero/psl)
- [Switch Animation by Aaron Iker](https://codepen.io/aaroniker/pen/oaQdQZ)
- [tippy.js](https://github.com/atomiks/tippyjs)
- [uikit](https://github.com/uikit/uikit)

## Developer Guide

- When contributing, it is important to note that we manage all package dependencies with npm. Thus, it is recommended to use `npm i` to install packages.
- In the event that you install a new dependency, you need to update Gruntfile.js file with a new task of the form:\
  `task: { expand: true, cwd: "./node_modules/..../", src: "*", dest: "./src/libs-js" }` depending on whether you need the js files or the css files of the newly installed library.
- When viewing your browser's console on a site you are sending GPC signals to, a 404 error regarding the site's GPC status file (`/.well-known/gpc.json`) may be shown. Note that this is perfectly normal, and will occur frequently (1) on sites that do not support GPC and (2) may even occur on sites that do respect GPC simply if the website does not host such a `/.well-known/gpc.json` file.
  
## FAQ \ Known quirks \ Reporting bugs

If you have questions about OptMeowt's functionality or have found a bug, please check out our [FAQ \ Known quirks](https://github.com/privacy-tech-lab/optmeowt-browser-extension/wiki/FAQ-%5C-Known-quirks) page on the [Wiki](https://github.com/privacy-tech-lab/optmeowt-browser-extension/wiki) first to see if we have already addressed the issue. If you cannot find what you are looking for, please feel free to open an issue and we will address it as soon as we can!

## More Information 🐈

Learn more on our [site](https://privacytechlab.org/optmeowt).

<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/main/plt_logo.png" width="200px" height="200px" alt="privacy-tech-lab logo">
<p>

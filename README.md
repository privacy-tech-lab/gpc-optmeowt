<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/issue-19/src/assets/cat-w-text/optmeow-logo-circle.png" width="150px" height="150px" title="OptMeowt logo">
<p>

# OptMeowt :paw_prints

OptMeowt ("Opt Me Out") is a browser extension for sending Do Not Sell signals to websites per the [Global Privacy Control draft spec](https://globalprivacycontrol.org/).

## Installing and Running OptMeowt

OptMeowt works on Chromium-based browsers as well as on Firefox.

### 1. Install OptMeowt via the Chrome Web Store or as Firefox Add-On

You can add OptMeowt to your browser at the [Chrome Web Store](https://chrome.google.com/webstore/detail/optmeowt/hdbnkdbhglahihjdbodmfefogcjbpgbo) or as a [Firefox Add-On](https://addons.mozilla.org/en-US/firefox/addon/optmeowt/).

### 2. Install OptMeowt as an Unpacked Extension on Chromium-based Browsers

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

## How does OptMeowt work?

OptMewot sends Do Not Sell signals to all domains a user visits when browsing the web. Such signals must be respected for California consumers per the California Consumer Privacy Act (CCPA), [Regs Section 999.315(d)](https://oag.ca.gov/sites/all/files/agweb/pdfs/privacy/oal-sub-final-text-of-regs.pdf). However, some companies respect such signals even when they are sent from outside of California.

OptMeowt currently sends Do Not Sell signals using five methods:

1. A new HTTP Do Not Sell header we are developing in a [proposed specification effort at the W3C](https://github.com/privacycg/proposals/issues/10).
2. The [existing DNT header](https://www.w3.org/TR/tracking-dnt/), which is interpreted by some publishers as a Do Not Sell header.
3. The [IAB CCPA Compliance Framework for Publishers & Technology Companies](https://iabtechlab.com/standards/ccpa/), implemented in a first party cookie.
4. Third party cookies of ad networks participating in the [DAA's CCPA Opt Out Tool for the Web](https://digitaladvertisingalliance.org/integrate-webchoices-ccpa).
5. Custom headers and cookies used by individual websites maintained and updated in a Do Not Sell list.

**Customizing which Sites Receive Do Not Sell Signals**
For every domain you visit OptMeowt will automatically add it to the `domain list` meaning that it will receive a Do Not Sell signal. However, you can exclude domains that should not receive a Do Not Sell signal. This functionality is available on OptMeowt's settings page that you can access from the popup window.

## OptMeowt's Permissions

We do not collect any data from you. Third parties will also not receive your data. The permissions OptMeowt is using are required for opting you out. These permissions include:

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

## Files and Directories in this Repo

- `src/`: Contains the main contents of the OptMeowt browser extension.
- `src/assets`: Contains the graphical elements of the extension, including the logos and button images.
- `src/libs`: Contains all of the libraries used in the browser extension.
- `src/options`: Contains the UI elements and scripts for the supplemental options page.
- `src/popup`: Contains the UI elements and scripts for the popup inside the extensions bar.
- `src/json`: Contains the JSON configuration files for OptMeowt's Do Not Sell cookies and headers.
- `src/json/cookies_3p.json`: Contains the 3rd party opt out cookies collected from various ad networks (especially those set by the [DAA's CCPA Opt Out Tool for the Web](https://optout.privacyrights.info/?c=1)).
- `src/json/cookies_usercustom.json`: JSON file where _users can place their own custom opt out cookies_ to be used by OptMeowt.
- `src/json/headers.json`: Contains the opt out HTTP header specs used by OptMeowt.
- `src/background.html`: OptMeowt's background page. Launches all critical extension scripts and libraries.
- `src/background.js`: This is the main script running OptMeowt. It controls all of the major backend, regarding whether the extension is on/off, sending the Do Not Sell signal, etc.
- `src/contentScript.js`: This is the main supplemental script that passes data to `background.js` and runs on every webpage loaded.
- `src/cookie_lists_json.js`: Handles placing all of the opt out cookies stored in `cookies_3p.json` and `cookies_usercustom.json`. This currently runs on OptMeowt's install or on an extension refresh.
- `src/dom.js`: This is a JS file that implements the functionality of setting a DOM GPC signal to an outgoing request
- `src/domainlist.js`: This is the main JS file that allows the extension to communicate with the `domain list` stored in the browser's local storage.
- `src/manifest.json`: This provides the browser with metadata about the extension, regarding its name, permissions, etc.
- `src/usprivacy.js`: Handles placing and updating 1st party opt out cookies (namely the IAB `usprivacy` string) for each site intended to receive Do Not Sell signals.
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

- When contibuting, it is important to note that we manage all package dependencies with npm. Thus, it is recommended to use the `npm i` command to install packages.
- In the event that you install a new dependency, you need to update Grantfile.js file with a new task of the form:\
  `task: { expand: true, cwd: "./node_modules/..../", src: "*", dest: "./src/libs-js" }` depending on whether you need the js files or the css files of the newly installed library.
- When viewing your browser's console on a site you are sending GPC signals to, a 404 error regarding the site's GPC status file (`/.well-known/gpc.json`) may be shown. Note that this is perfectly normal, and will occur frequently (1) on sites that do not support GPC and (2) may even occur on sites that do respect GPC simply if the website does not host such a `/.well-known/gpc.json` file.
  
## FAQ \ Known quirks \ Reporting bugs

If you have questions about OptMeowt's functionality, or believe you may have found a bug, please check out our [FAQ \ Known quirks](https://github.com/privacy-tech-lab/optmeowt-browser-extension/wiki/FAQ-%5C-Known-quirks) page on the [Wiki](https://github.com/privacy-tech-lab/optmeowt-browser-extension/wiki) above to see if we have already addressed the issue. If you cannot find what you are looking for, please feel free to open an issue and we will address it as soon as we can! We appreciate any input from all of our users!

## More Information

Visit our [site](https://privacytechlab.org/optmeowt) to learn more.

<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/main/plt_logo.png" width="200px" height="200px" title="privacy-tech-lab logo">
<p>

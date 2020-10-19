<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/issue-19/src/assets/cat-w-text/optmeow-logo-circle.png" width="150px" height="150px" title="OptMeowt logo">
<p>

# OptMeowt :paw_prints:

OptMeowt ("Opt Me Out") is a browser extension for sending Do Not Sell signals to websites per the [Global Privacy Control draft spec](https://globalprivacycontrol.org/).

## How does OptMeowt work?

OptMewot sends Do Not Sell signals to all domains a user visits when browsing the web. Such signals must be respected for California consumers per the California Consumer Privacy Act (CCPA), [Regs Section 999.315(d)](https://oag.ca.gov/sites/all/files/agweb/pdfs/privacy/oal-sub-final-text-of-regs.pdf). However, many companies respect such signals even when they are sent from outside of California.

OptMeowt currently sends Do Not Sell signals using five methods:

1. A new HTTP Do Not Sell header we are developing in a [proposed specification effort at the W3C](https://github.com/privacycg/proposals/issues/10).
2. The [existing DNT header](https://www.w3.org/TR/tracking-dnt/), which is interpreted by some publishers as a Do Not Sell header.
3. The [IAB CCPA Compliance Framework for Publishers & Technology Companies](https://iabtechlab.com/standards/ccpa/), implemented in a first party cookie.
4. Third party cookies of ad networks participating in the [DAA's CCPA Opt Out Tool for the Web](https://digitaladvertisingalliance.org/integrate-webchoices-ccpa).
5. Custom headers and cookies used by individual websites maintained and updated in a Do Not Sell list.

**Customizing which Sites Receive Do Not Sell Signals**
Every domain a user visits will be automatically added to a `domain list` and will receive a Do Not Sell signal by default. However, users can exclude domains that should not receive a Do Not Sell signal. This functionality is available by accessing the domain list from the extension's popup window.

## Installing and Running OptMeowt

OptMeowt works on any Chromium-based browser. In addition to Chrome, it should run in Brave, Edge, Opera, and Vivaldi. In the future we hope to support Firefox and Safari as well. There are two main ways you can install OptMeowt on your computer:

### 1. Install OptMeowt via the Chrome Web Store

1. You can simply add OptMeowt to your browser by donwloading the extension from the Chrome Web Store using this [link.](https://chrome.google.com/webstore/detail/optmeowt/hdbnkdbhglahihjdbodmfefogcjbpgbo)
2. Click Add to Chrome to install OptMeowt.

### 2. Install OptMeowt as an unpacked extension on Chrome as follows:

1. Clone this repo or download a zipped copy and unzip it.
2. In Chrome, navigate to the extensions page at `chrome://extensions/`.
3. If you have not done so yet, enable `Developer mode` with the slider on the top right corner of the extension page.
4. Click the `Load unpacked` button in the top left of the page.
5. Navigate to where you unzipped the OptMeowt folder and open up the `src` folder.
   **Note:** You do not need to click on the `manifest.json` file in Chrome, though other browsers may require this.
6. Click to finalize the install.

You did it! You have installed OptMeowt. You can use it via the icon next to the search bar.

## Files and Directories in the Repo

- `src/`: Contains the main contents of the OptMeowt browser extension.
- `src/assets`: Contains the graphical elements of the extension, including the logos and button images.
- `src/libs`: Contains all of the libraries used in the browser extension.
- `src/options`: Contains the UI elements and scripts for the supplemental options page.
- `src/popup`: Contains the UI elements and scripts for the popup inside the extensions bar.
- `src/yaml`: Contains the YAML configuration files for OptMeowt's Do Not Sell cookies and headers.
- `src/yaml/cookies_3p.yaml`: Contains the 3rd party opt out cookies collected from various ad networks (especially those set by the [DAA's CCPA Opt Out Tool for the Web](https://optout.privacyrights.info/?c=1)).
- `src/yaml/cookies_usercustom.yaml`: YAML file where _users can place their own custom opt out cookies_ to be used by OptMeowt.
- `src/yaml/headers.yaml`: Contains the opt out HTTP header specs used by OptMeowt.
- `src/background.html`: OptMeowt's background page. Launches all critical extension scripts and libraries.
- `src/background.js`: This is the main script running OptMeowt. It controls all of the major backend, regarding whether the extension is on/off, sending the Do Not Sell signal, etc.
- `src/contentScript.js`: This is the main supplemental script that passes data to `background.js` and runs on every webpage loaded.
- `src/cookie_lists_yaml.js`: Handles placing all of the opt out cookies stored in `cookies_3p.yaml` and `cookies_usercustom.yaml`. This currently runs on OptMeowt's install or on an extension refresh.
- `src/dom.js`: This is a JS file that implements the functionality of setting a DOM GPC signal to an outgoing request
- `src/domainlist.js`: This is the main JS file that allows the extension to communicate with the `domain list` stored in the browser's local storage.
- `src/manifest.json`: This provides the browser with metadata about the extension, regarding its name, permissions, etc.
- `src/usprivacy.js`: Handles placing and updating 1st party opt out cookies (namely the IAB `usprivacy` string) for each site intended to receive Do Not Sell signals.
- `ui-mockup`: Contains PDF and XD files demonstrating the preliminary mockup and analysis of OptMeowt.

## Third Party Libraries

OptMeowt uses the following third party libraries. We thank the developers.

- [animate.css](https://github.com/animate-css/animate.css)
- [mustache.js](https://github.com/janl/mustache.js)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [uikit](https://github.com/uikit/uikit)
- [Switch Animation by Aaron Iker](https://codepen.io/aaroniker/pen/oaQdQZ)
- [psl (Public Suffix List)](https://github.com/lupomontero/psl)
- [Dark Mode Switch](https://github.com/coliff/dark-mode-switch)
- [yaml (JavaScript parser)](https://github.com/eemeli/yaml)
- [tippy.js](https://github.com/atomiks/tippyjs)

<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/master/plt_logo.png" width="200px" height="200px" title="privacy-tech-lab logo">
<p>

## More Information

Visit Our [Landing Page](https://privacy-tech-lab.github.io/optmeowt) to learn more about us and what we do.

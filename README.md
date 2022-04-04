<p align="center">
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/privacy-tech-lab/gpc-optmeowt"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/releases"><img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/privacy-tech-lab/gpc-optmeowt"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/commits/main"><img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/privacy-tech-lab/gpc-optmeowt"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues-raw/privacy-tech-lab/gpc-optmeowt"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/issues?q=is%3Aissue+is%3Aclosed"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed-raw/privacy-tech-lab/gpc-optmeowt"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md"><img alt="GitHub" src="https://img.shields.io/github/license/privacy-tech-lab/gpc-optmeowt"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/watchers"><img alt="GitHub watchers" src="https://img.shields.io/github/watchers/privacy-tech-lab/gpc-optmeowt?style=social"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/privacy-tech-lab/gpc-optmeowt?style=social"></a>
  <a href="https://github.com/privacy-tech-lab/gpc-optmeowt/network/members"><img alt="GitHub forks" src="https://img.shields.io/github/forks/privacy-tech-lab/gpc-optmeowt?style=social"></a>
</p>
  
<br>

<p align="center">
  <a href="https://www.privacytechlab.org/optmeowt/"><img src="https://github.com/privacy-tech-lab/gpc-optmeowt/blob/issue-19/src/assets/cat-w-text/optmeow-logo-circle.png" width="150px" height="150px" alt="OptMeowt logo"></a>
</p>

# OptMeowt 🐾

OptMeowt ("Opt Me Out") is a browser extension for opting you out from web tracking. OptMeowt works by sending Do Not Sell signals to visited websites per the [Global Privacy Control (GPC) spec](https://globalprivacycontrol.github.io/gpc-spec/) that we are developing [at the W3C](https://github.com/privacycg/proposals/issues/10) and placing opt out cookies.

<p align="center">
  <a href="https://addons.mozilla.org/en-US/firefox/addon/optmeowt/"><img src="https://github.com/privacy-tech-lab/optmeowt/blob/main/firefox-add-ons-badge.png" width="172px" alt="Firefox Add Ons badge"></a>
  <a href="https://chrome.google.com/webstore/detail/optmeowt/hdbnkdbhglahihjdbodmfefogcjbpgbo"><img src="https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/chrome-web-store-badge.png" width="200px" alt="Chrome Web Store badge"></a>
<p>

OptMeowt is developed and maintained by Kuba Alicki (@kalicki1), Oliver Wang (@OliverWang13), Sophie Eng (@sophieeng), and Sebastian Zimmeck (@SebastianZimmeck) of the [privacy-tech-lab](https://www.privacytechlab.org/). Stanley Markman (@stanleymarkman), Kiryl Beliauski (@kbeliauski), Daniel Knopf (@dknopf), and Abdallah Salia (@asalia-1) contributed earlier.

## How does OptMeowt work?

OptMeowt sends Do Not Sell signals to websites when you browse the web. Such signals must be respected for California consumers per the California Consumer Privacy Act (CCPA), [Regs Section 999.315(d)](https://oag.ca.gov/sites/all/files/agweb/pdfs/privacy/oal-sub-final-text-of-regs.pdf). Some companies also respect them when they are sent from outside of California. OptMeowt also places opt out cookies.

In detail, OptMeowt uses five methods to opt you out:

1. The [GPC header and JS property](https://globalprivacycontrol.github.io/gpc-spec/).
2. The [DNT header](https://www.w3.org/TR/tracking-dnt/).
3. First party cookies of ad networks participating in the [IAB CCPA Compliance Framework for Publishers & Technology Companies](https://iabtechlab.com/standards/ccpa/).
4. Third party cookies of ad networks participating in the [DAA's CCPA Opt Out Tool for the Web](https://digitaladvertisingalliance.org/integrate-webchoices-ccpa).

**Customizing which sites receive Do Not Sell signals:** For every site you visit OptMeowt will automatically add its domain to the `domain list`. Each newly added domain will receive Do Not Sell signals by default. However, you can exclude domains that should not receive Do Not Sell signals. This functionality is available on OptMeowt's settings page, which you can access from OptMeowt's popup window.

## Installing OptMeowt from Source

1. Clone this repo locally or download a zipped copy and unzip it.
2. Install [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
3. From within your local `/gpc-optmeowt/` directory install OptMeowt's dependencies with `npm ci`.
4. Build the project by running `npm run build`, which will create a built for both Chrome and Firefox in `.../gpc-optmeowt/dist/chrome/` and `.../gpc-optmeowt/dist/firefox/`, respectively. `npm run build` will also create packaged versions of OptMeowt in `.../gpc-optmeowt/packages` for distribution on the Chrome Web Store and on Firefox Add-Ons.

### Chrome

5. In Chrome, navigate to the extensions page at `chrome://extensions/`.
6. Enable `Developer mode` with the slider on the top right corner of the extension page.
7. Click the `Load unpacked` button in the top left of the page.
8. Select the directory where you built OptMeowt, by default `/gpc-optmeowt/dist/chrome/` (the directory that contains the `manifest.json``).

### Firefox

5. In Firefox, navigate to the addons page with developer privileges at `about:debugging#/runtime/this-firefox`.
6. Under `Temporary extensions`, click `Load Temporary Add-on..`.
7. Select the manifest from the directory where you built OptMeowt, by default `/gpc-optmeowt/dist/firefox/manifest.json/`.

**Note:** OptMeowt is in active development and new features are frequently added, some of which may cause errors. You can always get the stable release version on the [Chrome Web Store](https://chrome.google.com/webstore/detail/optmeowt/hdbnkdbhglahihjdbodmfefogcjbpgbo) and on [Firefox Add-Ons](https://addons.mozilla.org/en-US/firefox/addon/optmeowt/).

  
## Analysis Mode (Firefox only)
Analysis Mode is used to investigate the GPC compliance of a given site. While not every site is required to respect GPC, this function of OptMeowt checks whether a site is compliant by searching for a DNS link (implying compliance), checking the US Privacy String, sending a GPC signal, and rechecking the US Privacy String. If the GPC signal is received, the US Privacy string should change the third character to a Y (i.e. 1YNN to 1YYN). If not, the site is not properly respecting GPC.

**Warning:** Do **not** browse normally in Analysis Mode. Analysis Mode disables the Content Security Policy on every site you visit. We do this to ensure that we can run an analysis on every site, however this can leave you susceptible to cross-site scripting and other malicious attacks. 

**Usage Note:** Analysis Mode **must** be run in a fresh browser without cookies or other user data. Additionally, legal obligations to respect GPC differ by geographic location. Our lab used a VPN pointing to Los Angeles to collect our data.

1. Load the extension, open the popup and click "Protection" to switch to Analysis Mode
2. Clear all cookies and all user data
3. Navigate to a site that you wish to analyze
4. Wait until 5 seconds pass after the site is fully loaded (i.e., refresh icon does not change back to an X)
5. Open the popup and hit `run analysis` (alternatively, `Alt+Shift+A`). If this step is done correctly the optmeowt popup logo will change yellow.
6. Repeat step 4 (Simply wait for the site to finish loading without refreshing)
7. Open the popup and hit `stop analysis` (alternatively, `ALt+Shift+S`). If this step is done correctly the optmeowt popup logo will return to green.
8. Open the popup to see the results of analysis


## Installing OptMeowt for Developers

To build the development versions of OptMeowt follow the directions above but replace `npm run build` with `npm run start`. This command will run the npm script (referenced in `package.json`) that will call Webpack in development mode (Webpack settings in `webpack.config.js`). `npm run start` will also initiate Webpack servers for both the Firefox and Chrome versions, which will listen for changes as you work and rebuild as necessary.

**Webpack and file structure notes:** 
  
Webpack will build the development versions of OptMeowt into the `dev` subdirectory instead of the `dist` subdirectory. The subdirectories for Chrome and Firefox are `dev/chrome` and `dev/firefox`, respectively.

Also, when you build for development, the development manifest (in `src/manifest-dev.json`) will be used instead of the distribution manifest (in `src/manifest-dist.json`). The development manifest contains an unsafe eval that we use for our source maps during development. The distribution manifest does not contain this eval. Webpack will select the correct manifest depending on whether you build for development or distribution.

To include new dependencies you can run `npm install` instead of `npm ci`. `npm install` will include new dependencies in the `package-lock.json`, which is generated from the `package.json`.
  
**For Windows users:** 
  
Note that we have built most of our codebase in MacOS, so path variables and similar code may cause the build to break in other OSs, in particular Windows. We recommend installing a Linux OS if you will be working with the codebase in any significant manner. 

### Optional

We also like to use [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug) from within VSCode when in development to help automate loading the built extension package. The default behavior is `F5` to launch and load the extension in browser. There is a similar extension for Chrome, [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome). Make sure to follow the online documentation on writing the correct `.vscode/launch.json` file, or other necessary settings files, in order to properly load OptMeowt with the debugger.

## OptMeowt's Permission Use

**Note:** We do not collect any data from you. Third parties will also not receive your data. The permissions OptMeowt is using are required for opting you out. To that end, OptMeowt uses the following permissions:

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

## OptMeowt's Architecture

Detailed information on OptMeowt's architecture is available in a [separate readme](https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/README_ARCHITECTURE.md).

## Directories in this Repo

- `src/`: Main contents of the OptMeowt browser extension.
- `src/assets`: Graphical elements of the extension, including logos and button images.
- `src/background`: Listeners for events and logic for placing cookies.
- `src/data`: Definitions of headers, cookies, and privacy flags.
- `src/options`: UI elements and scripts for the supplemental options page.
- `src/popup`: UI elements and scripts for the popup inside the extensions bar.
- `src/theme`: Dark and light mode themes.
- `ui-mockup`: Contains PDF and XD files demonstrating the preliminary mockup and analysis of OptMeowt.

## Third Party Libraries

OptMeowt uses various [third party libraries](https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/package.json). We thank the developers.

## Developer Guide
  
### Keyboard Shortcuts

- `Alt+Shift+A` — runs `a`nalysis (eq. to clicking `Run Analysis` in popup)
- `Alt+Shift+S` — `s`tops analysis (eq. to clicking `Stop Analysis` in popup)
  
Reminder: Users **must** "stop analysis" prior to changing sites to prevent recording incorrect data
  
### Other Notes

- If you want to contribute, note that we manage all library dependencies with npm. Thus, it is recommended to use `npm i` to install libraries.
- When viewing your browser's console on a site, a 404 error regarding the domain's GPC status file (`/.well-known/gpc.json`) may be shown. Note that this is normal and will occur (1) on domains that do not support GPC and (2) on domains that support GPC but do not host a `/.well-known/gpc.json` file.
- If you have questions about OptMeowt's functionality or have found a bug, please check out our [FAQ \ Known quirks](https://github.com/privacy-tech-lab/gpc-optmeowt/wiki/FAQ-%5C-Known-quirks) page on the [Wiki](https://github.com/privacy-tech-lab/gpc-optmeowt/wiki) first. If you cannot find what you are looking for, feel free to open an issue, and we will address it.

## More Information 🐈

Learn more [here](https://privacytechlab.org/optmeowt).

<p align="center">
  <a href="https://www.privacytechlab.org/"><img src="https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/plt_logo.png" width="200px" height="200px" alt="privacy-tech-lab logo"></a>
<p>

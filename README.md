<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/issue-19/src/assets/cat-w-text/optmeow-logo-circle.png" width="150px" height="150px" title="OptMeowt logo">
<p>

# OptMeowt :paw_prints:

OptMeowt is a browser extension that works by sending Do Not Sell signals to websites that users wish to access.

We accomplish this by:
1) Providing users with options regarding who to send the Do Not Sell signals to.
2) Providing users information about locations we have sent the Do Not Sell signal to.
3) By sending an HTTP request header upon website access noting to website hosts that the user does not want their data sold, according to the options above.

This extension is designed to be compliant with the California Consumer Privacy Act (CCPA).

## Running and Installing OptMeowt

You can currently install OptMeowt to any Chrome-based web browser. While we do not currently support Firefox, we are diligently working on compatibility across both Chrome-based browsers and Firefox.

Note that though this extension has been thoroughly tested in Google Chrome, it should also run in other Chrome-based browsers including Vivaldi, Opera, Microsoft Edge, and Brave, amongst others.

### Downloading

In order to download OptMeowt, you can either clone our repo to your machine and follow the installation steps below, or alternatively you can click the green `Clone or download` button above and then click `DOWNLOAD ZIP` to download a full copy of the repo. If you download a zip copy, make sure to unzip the downloaded zipped file before moving on to the installation step. Note where on your machine you have saved this folder.

### Installing the Extension on Google Chrome

In order to install OptMeowt on Google Chrome, first navigate to the `Extensions` page from the dropdown menu in the top right corner of the browser window, inside the "hamburger" icon consisting of three vertical dots. Alternatively, you can type `chrome://extensions/` into your search bar and click enter.

Once inside the `Extensions` page, the following steps will show you how to install the unpacked OptMeowt browser extension:
1) Click the `Load unpacked` button in the top left of the page.
2) Navigate to the now unzipped OptMeowt folder.
3) Click and open up the `src` folder within the downloaded folder.
**Note:** You do not need to click on the `manifest.json` file in Chrome, though other browsers may require this.
4) Click to finalize and install.

Congratulations! You have installed OptMeowt, and can now use it with the newly installed icon next to the search bar.

## Files and Directories in the Repo

- `src/`: Contains the main contents of the OptMeowt browser extension.
- `src/assets`: Contains the graphical elements of the extension, including the logos and button images.
- `src/libs`: Contains all of the libraries used in the browser extension.
- `src/options`: Contains the UI elements and scripts for the supplemental options page.
- `src/popup`: Contains the UI elements and scripts for the popup inside the extensions bar.
- `src/background.js`: This is the main script running OptMeowt. It controls all of the major backend, regarding whether the extension is on/off, sending the Do Not Sell signal, etc.
- `src/contentScript.js`: This is the main supplemental script that passes data to `background.js` and runs on every webpage loaded.
- `src/manifest.json`: This provides the browser with metadata about the extension, regarding its name, permissions, etc.
- `src/whitelist.js`: This is the main JS file that allows the extension to communicate with the whitelist stored in the browser's local storage.
- `ui-mockup`: Contains PDF and XD files demonstrating the preliminary mockup and analysis of OptMeowt.

## Third Party Libraries

OptMeowt uses the following third party libraries. We thank the developers.
- [animate.css](https://github.com/animate-css/animate.css)
- [mustache.js](https://github.com/janl/mustache.js)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [uikit](https://github.com/uikit/uikit)
- [Switch Animation by Aaron Iker](https://codepen.io/aaroniker/pen/oaQdQZ)
- [psl (Public Suffix List)](https://github.com/lupomontero/psl)

<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/master/plt_logo.png" width="200px" height="200px" title="privacy-tech-lab logo">
<p>

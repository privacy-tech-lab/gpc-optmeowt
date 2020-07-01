<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/issue-19/src/assets/cat-w-text/optmeow-logo-circle.png" width="150px" height="150px" title="OptMeowt logo">
<p>

# OptMeowt :paw_prints:

OptMeowt ("Opt Me Out") is a browser extension for sending Do Not Sell signals to websites (once we finalized development!). It is an implementation of [current work towards a W3C specification](https://github.com/privacycg/proposals/issues/10) for opting out from the sale of personal information, especially, per the California Consumer Privacy Act (CCPA), particularly, [Section 999.315(d) of the Regulations](https://oag.ca.gov/sites/all/files/agweb/pdfs/privacy/oal-sub-final-text-of-regs.pdf).

Feel free to make a feature request, open a pull request, or just [get in touch](https://github.com/SebastianZimmeck). We are academic researchers at Wesleyan University's [privacy-tech-lab](https://privacy-tech-lab.github.io/), and we would like to collaborate with anyone who is interested in moving Do Not Sell forward.

## Installing and Running OptMeowt

You can install OptMeowt to any Chromium-based web browser. In addition to Google Chrome, it should also run in Vivaldi, Opera, Microsoft Edge, and Brave. In the future we hope to support Firefox and Safari as well.

Here are the instructions for installing OptMeowt as an unpacked extension on Google Chrome:

1. Clone this repo or download a zipped copy and unzip it.
2. In Google Chrome, navigate to the extensions page at `chrome://extensions/`.
3. If you have not done so yet, enable `Developer mode` with the slider on the top right corner of the extension page.
4. Click the `Load unpacked` button in the top left of the page.
5. Navigate to where you unzipped the OptMeowt folder and open up the `src` folder.
**Note:** You do not need to click on the `manifest.json` file in Chrome, though other browsers may require this.
6. Click to finalize and install.

Congratulations! You have installed OptMeowt. You can use via the icon next to the search bar.

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
- [Dark Mode Switch](https://github.com/coliff/dark-mode-switch)

<p align="center">
  <img src="https://github.com/privacy-tech-lab/optmeowt-browser-extension/blob/master/plt_logo.png" width="200px" height="200px" title="privacy-tech-lab logo">
<p>

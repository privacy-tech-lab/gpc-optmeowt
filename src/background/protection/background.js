/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
background.js
================================================================================
background.js is the main background script handling OptMeowt's
main opt-out functionality
*/

import { enableListeners, disableListeners } from "./listeners-$BROWSER.js";
import { stores, storage } from "../storage.js";
import { modes } from "../../data/modes.js";
import { defaultSettings } from "../../data/defaultSettings.js";
import { initCookiesOnInstall } from "./cookiesOnInstall.js";

// We could alt. use this in place of "building" for chrome/ff, just save it to settings in storage
var userAgent =
  window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome";

/******************************************************************************/

/**
 * Enables extension functionality and sets site listeners
 * Information regarding the functionality and timing of webRequest and webNavigation
 * can be found on Mozilla's & Chrome's API docuentation sites (also linked above)
 *
 * The actual listeners are located in `listeners-(chosen browser).js`
 * The functions called on event occurance are located in `events.js`
 *
 * HIERARCHY:   manifest.json --> background.js --> listeners-$BROWSER.js --> events.js
 */

/******************************************************************************/

/**
 * Initializes the extension
 * Place all initialization necessary, as high level as can be, here:
 * (1) Sets settings defaults (if not done so), by comparing to whatever
 *     is already placed in the settings store via `storage.js`
 * (2) Places Do Not Sell cookies to be placed on install
 * (3) Sets correct extension on/off mode
 */
async function init() {
  initCookiesOnInstall();
  enableListeners();
}

function halt() {
  disableListeners();
}

/******************************************************************************/

export const background = {
  init,
  halt,
};

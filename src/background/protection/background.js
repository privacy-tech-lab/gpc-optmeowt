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
import { defaultSettings } from "../../data/defaultSettings.js";

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
 * HIERARCHY:   manifest.json --> protection --> background.js --> listeners-$BROWSER.js --> events.js
 */

/******************************************************************************/

/**
 * Initializes the extension
 * Place all initialization necessary, as high level as can be, here.
 */
async function init() {
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

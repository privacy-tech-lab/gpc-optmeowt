/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
background.js
================================================================================
background.js is the main background script handling OptMeowt's
main opt-out functionality
*/

import { enableListeners, disableListeners } from "./listeners-$BROWSER.js"
import { 
  // extensionMode, 
  stores, 
  storage 
} from "../storage.js"
import { modes } from "../../data/modes.js";
import { defaultSettings } from "../../data/defaultSettings.js"
import { initCookiesOnInstall } from "./cookiesOnInstall.js"


// We could alt. use this in place of "building" for chrome/ff, just save it to settings in storage
var userAgent = window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome";


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
function enable() {
  enableListeners();
}

/**
 * Disables extension functionality
 */
function disable() {
  disableListeners();
}

function preinit() {};

/**
 * Initializes the extension
 * Place all initialization necessary, as high level as can be, here:
 * (1) Sets settings defaults (if not done so)
 * (2) Places cookies to be placed on install
 * (3) Sets correct extension on/off mode
 */
async function init() {
  // Pulls settings store from IDB and saves locally in settingsDB
  const settingsValues = await storage.getAll(stores.settings);
  const settingsKeys = await storage.getAllKeys(stores.settings);
  let settingsDB = {};
  let setting;
  for (let key in settingsKeys) {
    setting = settingsKeys[key];
    settingsDB[setting] = settingsValues[key];
  }

  // Check if settings are set; if not, place according to defaultSettings.js
  for (let setting in defaultSettings) {
    if (!settingsDB[setting]) {
      await storage.set(stores.settings, defaultSettings[setting], setting);
    }
  }

  // Place on-install Do Not Sell cookies
  initCookiesOnInstall();

  // Initialize extension mode
  const mode = defaultSettings.MODE;
  if (mode === modes.readiness.enabled || mode === modes.readiness.domainlisted) {
    enable();
  } else {
    disable();
  }
}

function postinit() {};

function halt() {};

export const background = {
  preinit,
  init,
  postinit,
  halt
}
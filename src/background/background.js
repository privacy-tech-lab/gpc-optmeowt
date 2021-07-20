/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

/*
background.js
================================================================================
background.js is the main background script handling OptMeowt's
main opt-out functionality
*/

import { enableListeners, disableListeners } from "./listeners-$BROWSER.js"
import { extensionMode, stores, storage } from "./storage.js"
import { defaultSettings } from "../data/defaultSettings.js"
import { initCookiesOnInstall } from "./cookiesOnInstall.js"


// We could alt. use this in place of "building" for chrome/ff, just save it to settings in storage
var userAgent = window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome"


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
export function enable() {
  enableListeners()
}

/**
 * Disables extension functionality
 */
export function disable() {
  disableListeners()
}

/**
 * Initializes the extension
 * Place all initialization necessary, as high level as can be, here:
 * (1) Sets settings defaults
 * (2) Places cookies to be placed on install
 * (3) Sets correct extension on/off mode
 */
async function init() {
  for (const setting in defaultSettings) {
    await storage.set(stores.settings, defaultSettings[setting], setting)
  }

  initCookiesOnInstall()
  
  const mode = defaultSettings.MODE
  if (mode === extensionMode.enabled || mode === extensionMode.domainlisted) {
    enable()
  } else {
    disable()
  }
}

// Initialize call
init()
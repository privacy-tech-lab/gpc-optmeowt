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
import { storage, stores } from "./storage.js"
import { extensionMode, defaultSettings } from "../data/settings.js"

import "./cookies_oninstall.js"


// Initializers
var tabs = {}; /// Store all active tab id's, domain, requests, and response
var wellknown = {} /// Store information about `well-known/gpc` files per tabs
var signalPerTab = {} /// Store information on a signal being sent for updateUI
var activeTabID = 0;
var sendSignal = false;
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
 * (2) Sets correct extension on/off mode
 */
async function init() {
  // Note: this may be done after enable()/disable() are called, b/c it is async and microtasked
  for (const setting in defaultSettings) {
    var sample = await storage.set(stores.settings, defaultSettings[setting], setting)
    console.log("init(1):: Set ", setting, " to storage ?")
  }
  
  const mode = defaultSettings.MODE
  if (mode === extensionMode.enabled || mode === extensionMode.domainlisted) {
    enable()
  } else {
    disable()
  }
//   // async function getAll() {
//   // };
//   // await getAll();
//   // const all = getAllFromStorage(stores.domainlist)

//   console.log("clearing .........")
//   console.log("clearing .........")
//   console.log("clearing .........")

//   for (const s in defaultSettings) {
//     var test = await getFromStorage(stores.settings, 'MODE')
//     console.log("post_init(1):: Got ", s, " = ", test, " from storage ?")
//   }

//   const val = 'BROWSER'
//   const all = await getFromStorage(stores.settings, val)
//   console.log("post_init(2):: From storage", all, val)

//   await setToStorage(stores.settings, "BRAVE LOL", "BROWSER")
//   let brave = await getFromStorage(stores.settings, "BROWSER")
//   console.log("post_init(3):: brave val = ", brave)
// }

// async function post_init(){
}

// Initialize call
init()

// post_init()
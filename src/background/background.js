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

import { setToStorage, domainlist, settings } from "./storage.js"


import { enableListeners, disableListeners } from "./listeners-$BROWSER.js"


// Initializers
var tabs = {}; /// Store all active tab id's, domain, requests, and response
var wellknown = {} /// Store information about `well-known/gpc` files per tabs
var signalPerTab = {} /// Store information on a signal being sent for updateUI
var activeTabID = 0;
var sendSignal = false;
// We could alt. use this in place of "building" for chrome/ff, just save it to settings in storage
var userAgent = window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome"
var global_domains = {};


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
async function enable() {
  enableListeners()
  setToStorage(settings, true, 'ENABLED')
}

/**
 * Disables extension functionality
 */
function disable() {
  disableListeners()
  setToStorage(settings, false, 'ENABLED')
  var counter = 0
}

/**
 * Initializes the extension
 * Place all initialization necessary, as high level as can be, here
 */
async function init() {
  enable()
}

// Initialize call
init()
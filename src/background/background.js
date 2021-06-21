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


import {
  onBeforeSendHeaders, 
  onHeadersReceived, 
  onBeforeNavigate,
  onCommitted
} from "./events.js"
import { setToStorage, getFromStorage } from "./storage.js"
import {
  initDomainlist,
  addToDomainlist, 
  removeFromDomainlist, 
  permRemoveFromDomainlist,
  getFromDomainlist,
  getDomainlist 
} from "./domainlist.js"


// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
// https://developer.chrome.com/docs/extensions/reference/webRequest/
// This is the extraInfoSpec array of strings
const mozRequestSpec = ["requestHeaders", "blocking"]
const mozResponseSpec = ["responseHeaders", "blocking"]
const chromeRequestSpec = ["requestHeaders", "extraHeaders", "blocking"]
const chromeResponseSpec = ["responseHeaders", "extraHeaders", "blocking"]

// This is the filter object
const filter = { urls: ["<all_urls>"] }

// Initializers
var tabs = {}; /// Store all active tab id's, domain, requests, and response
var wellknown = {} /// Store information about `well-known/gpc` files per tabs
var signalPerTab = {} /// Store information on a signal being sent for updateUI
var activeTabID = 0;
var sendSignal = false;
var userAgent = window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome"
var global_domains = {};


/**
 * Enables extension functionality and sets site listeners
 * Information regarding the functionality and timing of webRequest and webNavigation 
 * can be found on Mozilla's & Chrome's API docuentation sites (also linked above)
 * 
 * The functions called on event occurance are located in `events.js`
 */
function enable() {   
  if (userAgent === "moz") {

    // (4) global Firefox listeners
    chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      filter,
      mozRequestSpec
    )
    chrome.webRequest.onHeadersReceived.addListener(
      onHeadersReceived,
      filter,
      mozResponseSpec
    )
    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate)
    chrome.webNavigation.onCommitted.addListener(onCommitted)
    setToStorage({ ENABLED: true })

  } else {
    
    // (4) global Chrome listeners
    chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      filter,
      chromeRequestSpec
    )
    chrome.webRequest.onHeadersReceived.addListener(
      onHeadersReceived,
      filter,
      chromeResponseSpec
    )
    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate, filter)
    chrome.webNavigation.onCommitted.addListener(onCommitted, filter)
    setToStorage({ ENABLED: true })

  }
}

/**
 * Disables extension functionality
 */
function disable() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
  chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
  chrome.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate);
  chrome.webNavigation.onCommitted.removeListener(onCommitted);
  setToStorage({ ENABLED: false });
  var counter = 0;
}


/**
 * Initializes the extension
 * Place all initialization necessary, as high level as can be, here
 */
async function init() {
  await initDomainlist() // initializes DOMAINLIST keyword in storage
  enable()
}

// Initialize call
init()
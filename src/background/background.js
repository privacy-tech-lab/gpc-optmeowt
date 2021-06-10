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
import { initDomainlist, addToDomainlist } from "./domainlist.js"

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
 */
function enable() {   
  if (userAgent === "moz") {

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
    chrome.storage.local.set({ ENABLED: true })

  } else {
    
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
    chrome.storage.local.set({ ENABLED: true })

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
  chrome.storage.local.set({ ENABLED: false });
  var counter = 0;
}


/* initialize */
async function init() {
  enable()

  // storage tests
  setToStorage({ ENABLED: true })
  getFromStorage("ENABLED", (res) => { console.log(res) })

  initDomainlist()
  getFromStorage("DOMAINLIST", (res) => { console.log("DOMAINS = ", res) })

  await addToDomainlist("http://google.com/")
  getFromStorage("DOMAINLIST", (res) => { console.log("DOMAINS = ", res) })
}

init()
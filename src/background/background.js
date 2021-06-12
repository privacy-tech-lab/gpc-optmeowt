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
  getDomainlist } from "./domainlist.js"

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


/* initialize extension */
async function init() {
  enable()

  // init domainlist test
  await initDomainlist() // initializes DOMAINLIST keyword in storage
  await setToStorage({ DOMAINLIST: {"http://amazon.com/": true} })
  await addToDomainlist("google.com")


  let domains = await getDomainlist()
  console.log("DOMAINLIST = ", domains)
  console.log("AMAZON = ", domains["google.com"])

  const amazon = await getFromDomainlist("http://amazon.com/")
  console.log("amazon = ", amazon)

  await removeFromDomainlist("google.com")
  domains = await getDomainlist()
  console.log("DOMAINLIST after removing google = ", domains)

  await permRemoveFromDomainlist("google.com")
  domains = await getDomainlist()
  console.log("DOMAINLIST after perm removing google = ", domains)


  /*
  console.log("starting writing to regular...")
  const set = await setToStorage({ ENABLED: true })
  const get = await getFromStorage("ENABLED")
  console.log("['ENABLED'] = ", get)
  console.log("wrote and read successfully")
  */

  // initDomainlist()
  // getFromStorage("DOMAINLIST", (res) => { console.log("DOMAINLIST = ", res) })

  // addToDomainlist("http://amazon.com/")
  // getFromStorage("DOMAINLIST", (res) => { console.log("DOMAINS2 = ", res) })




  // //init domain list
  // await chrome.storage.local.get(["DOMAINLIST"], (result) => {
  //   if (result["DOMAINLIST"] === undefined) {
  //       chrome.storage.local.set({ DOMAINLIST: {"amazon.com": true} })
  //   }
  // })

  // // get blank from storage
  // await chrome.storage.local.get(["DOMAINLIST"], (result) => {
  //   console.log(result["DOMAINLIST"])
  // })

  // store value in storage

  // get new updated value from storage (not blank)

}

init()
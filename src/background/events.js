/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

/*
events.js
================================================================================
events.js implmements our per-site functionality for the background listeners
*/


import { enable, disable } from "./background.js"
import { extensionMode, stores, storage } from "./storage.js"
import { headers } from "../data/headers.js"
import { initIAB } from "./cookiesIAB.js"
import { initCookiesPerDomain } from "./cookiesOnInstall.js"
import psl from "psl"

// Initializers (cached values)
var sendSignal = true // caches if the signal can be sent to the curr domain
var tabs = {}         // caches all tab infomration
var wellknown = {}    // caches wellknown info for popup
var signalPerTab = {} // Store information on a signal being sent for updatePopupIcon
var activeTabID = 0;  // caches active tab id


/******************************************************************************/


/*
 * The four following functions are all related to the four main listeners in 
 * `background.js`. These four functions implement all the other helper 
 * functions below
 */


/**
 * Handles all signal processessing prior to sending request headers
 * @param {object} details - retrieved info passed into callback
 * @returns {array} details.requestHeaders from addHeaders 
 */
const onBeforeSendHeaders = async (details) => {
  await updateDomainsAndSignal(details)

  if (sendSignal) {
    signalPerTab[details.tabId] = true
    initIAB()
    updatePopupIcon(details);
    return addHeaders(details)
  } 
  // else {
  //   return details
  // }
}

/**
 * @param {object} details - retrieved info passed into callback
 */
const onHeadersReceived = (details) => {
  logData(details);
  // incrementBadge(details);
  // dataToPopup()
}

/**
 * @param {object} details - retrieved info passed into callback
 */
const onBeforeNavigate = (details) => {
  // Resets certain cached info
  if (details.frameId === 0) {
    wellknown[details.tabId] = null
    console.log("signalPerTab:", signalPerTab)
    signalPerTab[details.tabId] = false

    // tabs[activeTabID].REQUEST_DOMAINS;

    console.log("1) tabs[activeTabID].REQUEST_DOMAINS: ", tabs[activeTabID].REQUEST_DOMAINS);
    console.log(`1.5) details.tabId: ${details.tabId} vs. activeTabID: ${activeTabID}`);
    tabs[activeTabID].REQUEST_DOMAINS = {};
    console.log("2) tabs[activeTabID].REQUEST_DOMAINS: ", tabs[activeTabID].REQUEST_DOMAINS);

  }
}
  
/**
 * Adds DOM property
 * @param {object} details - retrieved info passed into callback
 */
const onCommitted = async (details) => {
  await updateDomainsAndSignal(details)

  // console.log("1) tabs[activeTabID]: ", tabs[activeTabID]);
  // console.log(`1.5) details.tabId: ${details.tabId} vs. activeTabID: ${activeTabID}`);
  // tabs[activeTabID].REQUEST_DOMAINS = {};
  // console.log("2) tabs[activeTabID]: ", tabs[activeTabID]);

  if (sendSignal) {
    addDomSignal(details)
  }
}


/******************************************************************************/


/**
 * Attaches headers from `headers.js` to details.requestHeaders
 * @param {object} details - retrieved info passed into callback
 * @returns {array} details.requestHeaders
 */
function addHeaders(details) {
  // if (sendSignal) {
    for (var signal in headers) {
      let s = headers[signal]
      details.requestHeaders.push({ name: s.name, value: s.value })
    }
    return { requestHeaders: details.requestHeaders }
  // } else {
  //   return { requestHeaders: details.requestHeaders };
  // }
}

/**
 * Runs `dom.js` to attach DOM signal
 * @param {object} details - retrieved info passed into callback
 */
function addDomSignal(details) {
  chrome.tabs.executeScript(details.tabId, {
    file: "dom.js",
    frameId: details.frameId, // Supposed to solve multiple injections
                              // as opposed to allFrames: true
    runAt: "document_start",
  });
}

async function updateDomainsAndSignal(details) {
  // Parse url to get domain for domainlist
  let url = new URL(details.url);
  let parsedUrl = psl.parse(url.hostname);
  let parsedDomain = parsedUrl.domain;

  let parsedDomainVal = await storage.get(stores.domainlist, parsedDomain)
  if (parsedDomainVal === undefined) {
    // Add current domain to domainlist in storage
    await storage.set(stores.domainlist, true, parsedDomain)
  }

  // Check to see if we should send signal
  // It can be undefined b/c we never reretrieve parsedDomainVal
  if (parsedDomainVal === undefined || parsedDomainVal === true) {
    sendSignal = true 
  } else {
    sendSignal = false
  }
}

function updatePopupIcon(details) {
  // console.log(`TAB ID FOR UPDATEUI ${details.tabId}`)
  if (wellknown[details.tabId] === undefined) {
    wellknown[details.tabId] = null
  }
  if (wellknown[details.tabId] === null) {
    chrome.browserAction.setIcon(
      {
        tabId: details.tabId,
        path: "assets/face-icons/optmeow-face-circle-green-ring-128.png",
      },
      function () {
        // console.log("Updated OptMeowt icon to GREEN RING");
      }
    );
  }
}
  
function logData(details) {
  var url = new URL(details.url);
  var parsed = psl.parse(url.hostname);

  console.log("current tabId: ", details.tabId)
  

  if (tabs[details.tabId] === undefined) {
    tabs[details.tabId] = { DOMAIN: null, REQUEST_DOMAINS: {}, TIMESTAMP: 0 };
    tabs[details.tabId].REQUEST_DOMAINS[parsed.domain] = {
      URLS: {},
      RESPONSE: details.responseHeaders,
      TIMESTAMP: details.timeStamp,
    };
    tabs[details.tabId].REQUEST_DOMAINS[parsed.domain].URLS = {
      URL: details.url,
      RESPONSE: details.responseHeaders,
    };
  } else {
    if (tabs[details.tabId].REQUEST_DOMAINS[parsed.domain] === undefined) {
      tabs[details.tabId].REQUEST_DOMAINS[parsed.domain] = {
        URLS: {},
        RESPONSE: details.responseHeaders,
        TIMESTAMP: details.timeStamp,
      };
      tabs[details.tabId].REQUEST_DOMAINS[parsed.domain].URLS[details.url] = {
        RESPONSE: details.responseHeaders,
      };
    } else {
      tabs[details.tabId].REQUEST_DOMAINS[parsed.domain].URLS[details.url] = {
        RESPONSE: details.responseHeaders,
      };
    }
  }
  // console.log("tabs[details.tabId] currently is; ", tabs[details.tabId])
  // console.log("details.tabId currently is; ", details.tabId)
}


/******************************************************************************/


function handleSendMessageError() {
  const error = chrome.runtime.lastError;
  if (error){
    console.warn(error.message)
  }
}

// Info back to popup
function dataToPopup() {
  let requestsData = {};

  if (tabs[activeTabID] !== undefined) {
    requestsData = tabs[activeTabID].REQUEST_DOMAINS;
    console.log("dataToPopup: tabs[activeTabID].REQUEST_DOMAINS = ", requestsData)
    console.log("activeTabID: ", activeTabID)
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    let tabID = tabs[0]["id"]
    let wellknownData = wellknown[tabID]

    let popupData = {
      requests: requestsData,
      wellknown: wellknownData
    }

    chrome.runtime.sendMessage({
      msg: "POPUP_DATA",
      data: popupData
    }, handleSendMessageError);
  });
}


// Listeners for info from popup or settings page
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log("recieved message")
  if (request.ENABLED != null) {
    if (request.ENABLED) {
      enable();
      await storage.set(stores.settings, extensionMode.enabled, 'MODE')
      // sendResponse("DONE");
    } else {
      disable();
      await storage.set(stores.settings, extensionMode.disabled, 'MODE')
      // sendResponse("DONE");
    }
  }
  if (request.msg == "POPUP") {
    dataToPopup()
  }
  if (request.msg === "WELLKNOWN_CONTENT_SCRIPT_DATA") {
    // console.log(`.well-known from ContentScr: ${JSON.stringify(request.data)}`);
    var tabID = sender.tab.id;
    wellknown[tabID] = request.data
    // console.log(`wellknown: ${JSON.stringify(wellknown)}`)
    // console.log(`wellknown[tabid]: ${JSON.stringify(wellknown[tabID])}`)
    // console.log("TAB ID: ", tabID)
    if (wellknown[tabID]["gpc"] === true){
      // console.log(`.well-known from ContentScr "gpc" === true`)
      // wellknown[tabID] = true
      // console.log("signalPerTab 1: ", signalPerTab);
      setTimeout(()=>{}, 10000);
      // console.log("signalPerTab 2: ", signalPerTab);
      if (signalPerTab[tabID] === true) {
        chrome.browserAction.setIcon(
          {
            tabId: tabID,
            path: "assets/face-icons/optmeow-face-circle-green-128.png",
          },
          function () {
            // console.log("Updated OptMeowt icon to SOLID GREEN.", );
          }
        );
      }
    }
  } 
  if (request.msg === "TAB") {
    // console.log("TAB MESSAGE HAS BEEN RECEIVED")
    var url = new URL(sender.origin);
    var parsed = psl.parse(url.hostname);
    var domain = parsed.domain;
    var tabID = sender.tab.id;
    if (tabs[tabID] === undefined) {
      tabs[tabID] = {
        DOMAIN: domain,
        REQUEST_DOMAINS: {},
        TIMESTAMP: request.data,
      };
    } else if (tabs[tabID].DOMAIN !== domain) {
      tabs[tabID].DOMAIN = domain;
      let urls = tabs[tabID]["REQUEST_DOMAINS"];
      // console.log("urls are:", urls)
      for (var key in urls) {
        if (urls[key]["TIMESTAMP"] >= request.data) {
          tabs[tabID]["REQUEST_DOMAINS"][key] = urls[key];
        } else {
          delete tabs[tabID]["REQUEST_DOMAINS"][key];
        }
      }

      tabs[tabID]["TIMESTAMP"] = request.data;
    }
  }
  if (request.msg === "SET_OPTOUT_COOKEIS") {
    // This is initialized when cookies are to be reset to a page after
    // do not sell is turned back on (e.g., when its turned on from the popup).

    // This is specifically for when cookies are removed when a user turns off
    // do not sell for a particular site, and chooses to re-enable it
    initCookiesPerDomain(request.data)
  }
})


/**
 * Listener for tab switch that updates curr tab badge counter
 */
 chrome.tabs.onActivated.addListener(function (info) {
  activeTabID = info.tabId
  // dataToPopup()
})

/**
 * Runs on startup to query current tab
 */
 chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.id !== undefined) {
    activeTabID = tab.id
  }
})

/**
 * Opens the options page
 */
chrome.runtime.onInstalled.addListener(function (object) {
  chrome.runtime.openOptionsPage((result) => {});
});


/******************************************************************************/



export { 
  onBeforeSendHeaders, 
  onHeadersReceived, 
  onBeforeNavigate,
  onCommitted,
  dataToPopup
}
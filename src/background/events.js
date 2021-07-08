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


import { headers } from "../data/headers.js"
import { storage, stores } from "./storage.js"
import { enable, disable } from "./background.js"
import { extensionMode } from "../data/settings.js"
import psl from "psl"

import { initIAB } from "./cookies_iab.js"


var sendSignal = true // cached
var tabs = {}         // cached for info
var activeTabID = 0;  // for info



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
const onBeforeSendHeaders = (details) => {
  updateDomainsAndSignal(details)
  initIAB()
  if (sendSignal) return addHeaders(details)
  else return details
}

/**
 * @param {object} details - retrieved info passed into callback
 */
const onHeadersReceived = (details) => {
  logData(details);
  // incrementBadge(details);
}

/**
 * @param {object} details - retrieved info passed into callback
 */
const onBeforeNavigate = (details) => {
}
  
/**
 * Adds DOM property
 * @param {object} details - retrieved info passed into callback
 */
const onCommitted = (details) => {
  addDomSignal(details)
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
  let parsed_url = psl.parse(url.hostname);
  let parsed_domain = parsed_url.domain;

  let parsed_domain_val = await storage.get(stores.domainlist, parsed_domain)
  if (parsed_domain_val === undefined) {
    // Add current domain to domainlist in storage
    await storage.set(stores.domainlist, true, parsed_domain)
  }

  // Check to see if we should send signal
  if (parsed_domain_val === undefined || parsed_domain_val === true) {
    sendSignal = true 
  } else {
    sendSignal = false
  }
}

function updateUI(details) {
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
  // console.log("Details.responseHeaders: ", details.responseHeaders);
  
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
  let requests = {};
  if (tabs[activeTabID] !== undefined) {
    for (var key in tabs[activeTabID].REQUEST_DOMAINS) {
      numberOfRequests += Object.keys(
        tabs[activeTabID].REQUEST_DOMAINS[key].URLS
      ).length;
    }
    requests = tabs[activeTabID].REQUEST_DOMAINS;
    // console.log(tabs[activeTabID]);
  }
  
  chrome.runtime.sendMessage({
    msg: "REQUESTS",
    data: requests,
  }, handleSendMessageError);
}


// Listeners for info from popup or settings page
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log("recieved message")
  if (request.ENABLED != null) {
    if (request.ENABLED) {
      enable();
      await storage.set(stores.settings, extensionMode.enabled, 'MODE')
      // sendResponse("DONE");
      console.log("enabled")
    } else {
      disable();
      await storage.set(stores.settings, extensionMode.disabled, 'MODE')
      // sendResponse("DONE");
      console.log("disabled")
    }
  }
  if (request.msg == "INIT") {
    dataToPopup();
  }
})


/**
 * Listener for tab switch that updates curr tab badge counter
 */
 chrome.tabs.onActivated.addListener(function (info) {
  activeTabID = info.tabId
})

/**
 * Runs on startup to query current tab
 */
 chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.id !== undefined) {
    activeTabID = tab.id
  }
})


/******************************************************************************/



export { 
  onBeforeSendHeaders, 
  onHeadersReceived, 
  onBeforeNavigate,
  onCommitted,
  dataToPopup
}
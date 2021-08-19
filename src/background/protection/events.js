/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
events.js
================================================================================
events.js (1) Implements our per-site functionality for the background listeners
          (2) Handles cached values & message passing to popup & options page
*/


import { enable, disable } from "./background.js"
import { 
  // extensionMode, 
  stores, 
  storage 
} from "./../storage.js"
import { modes } from "../../data/modes.js"
import { defaultSettings } from "../../data/defaultSettings.js"
import { headers } from "../../data/headers.js"
import { initIAB } from "./cookiesIAB.js"
import { initCookiesPerDomain } from "./cookiesOnInstall.js"
import psl from "psl"

// Initializers (cached values)
var domainlist = {};    // Caches & mirrors domainlist in storage
var mode = defaultSettings["MODE"]; // Caches the extension mode
var tabs = {};          // Caches all tab infomration, i.e. requests, etc. 
var wellknown = {};     // Caches wellknown info to be sent to popup
var signalPerTab = {};  // Caches if a signal is sent to render the popup icon
var activeTabID = 0;    // Caches current active tab id
var sendSignal = true;  // Caches if the signal can be sent to the curr domain

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
const onBeforeSendHeaders = (details) => {
  // await updateDomainsAndSignal(details);
  updateDomainlistAndSignal(details);

  if (sendSignal) {
    signalPerTab[details.tabId] = true
    initIAB();
    updatePopupIcon(details);
    return addHeaders(details);
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
  // dataToPopup()
}

/**
 * @param {object} details - retrieved info passed into callback
 */
const onBeforeNavigate = (details) => {
  // Resets certain cached info
  if (details.frameId === 0) {
    wellknown[details.tabId] = null;
    signalPerTab[details.tabId] = false;
    tabs[activeTabID].REQUEST_DOMAINS = {};
  }
}
  
/**
 * Adds DOM property
 * @param {object} details - retrieved info passed into callback
 */
const onCommitted = async (details) => {
  // await updateDomainsAndSignal(details)
  updateDomainlistAndSignal(details);

  if (sendSignal) {
    addDomSignal(details)
  }
}


/******************************************************************************/
// Listener helper functions - main functionality


/**
 * Attaches headers from `headers.js` to details.requestHeaders
 * @param {object} details - retrieved info passed into callback
 * @returns {array} details.requestHeaders
 */
function addHeaders(details) {
  for (let signal in headers) {
    let s = headers[signal]
    details.requestHeaders.push({ name: s.name, value: s.value })
  }
  return { requestHeaders: details.requestHeaders }
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

// async function updateDomainsAndSignal(details) {
//   // Parse url to get domain for domainlist
//   let url = new URL(details.url);
//   let parsedUrl = psl.parse(url.hostname);
//   let parsedDomain = parsedUrl.domain;

//   // Update domains by adding current domain to domainlist in storage.
//   let parsedDomainVal = await storage.get(stores.domainlist, parsedDomain);
//   if (parsedDomainVal === undefined) {
//     await storage.set(stores.domainlist, true, parsedDomain);
//   }

//   // Check to see if we should send signal.
//   // NOTE: It can be undefined b/c we never reretrieve parsedDomainVal
//   // (1) Check which MODE OptMeowt is in,
//   // (2) if domainlisted, check if in domainlist
//   const mode = await storage.get(stores.settings, "MODE");
//   if (mode === extensionMode.domainlisted) {
//     if (parsedDomainVal === undefined || parsedDomainVal === true) {
//       sendSignal = true;
//     } else {
//       sendSignal = false;
//     }
//   } else if (mode === extensionMode.enabled) {
//     sendSignal = true;
//   } else {
//     sendSignal = false;
//   }
// }

function updateDomainlistAndSignal(details) {
  // Parse url to get domain for domainlist
  let url = new URL(details.url);
  let parsedUrl = psl.parse(url.hostname);
  let parsedDomain = parsedUrl.domain;

  // Update domains by adding current domain to domainlist in storage.
  let parsedDomainVal = domainlist[parsedDomain];
  if (parsedDomainVal === undefined) {
    storage.set(stores.domainlist, true, parsedDomain); // Sets to storage async
    domainlist[parsedDomain] = true;                    // Sets to cache
    parsedDomainVal = true;
  }

  // Check to see if we should send signal.
  // NOTE: It can be undefined b/c we never reretrieve parsedDomainVal
  // (1) Check which MODE OptMeowt is in,
  // (2) if domainlisted, check if in domainlist
  // const mode = await storage.get(stores.settings, "MODE");
  if (mode === modes.readiness.domainlisted) {
    if (parsedDomainVal === true) {
      sendSignal = true;
    } else {
      sendSignal = false;
    }
  } else if (mode === modes.readiness.enabled) {
    sendSignal = true;
  } else {
    sendSignal = false;
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
      function () { /*console.log("Updated OptMeowt icon to GREEN RING");*/ }
    );
  }
  
}
  
function logData(details) {
  let url = new URL(details.url);
  let parsed = psl.parse(url.hostname);
  // console.log("current tabId: ", details.tabId)

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

async function pullToDomainlistCache() {
  let domain;
  let domainlistKeys = await storage.getAllKeys(stores.domainlist);
  let domainlistValues = await storage.getAll(stores.domainlist);
  // console.log(`domainlistKeys = ${domainlistKeys} \n domainlistValues = ${domainlistValues}`);
  for (let key in domainlistKeys) {
    domain = domainlistKeys[key];
    domainlist[domain] = domainlistValues[key];
  }
  // console.log(`domainlist updated = `, domainlist);
}

function pushDomainlistCache() {
}

async function setCachedMode() {
  mode = await storage.get(stores.settings, "MODE");
}


async function syncDomainlists() {
  console.log("INITIALIZING THE SYNCDOMAINLISTS ON PORT CLOSED");
  // (1) Reconstruct a domainlist indexedDB object from storage
  // (2) Iterate through local domainlist
  // --- If item in cache NOT in domainlistKeys/domainlistDB, add to storage 
  //     via storage.set()
  // (3) Iterate through all domain keys in indexedDB domainlist
  // --- If key NOT in cached domainlist, add to cached domainlist

  let domainlistKeys = await storage.getAllKeys(stores.domainlist);
  let domainlistValues = await storage.getAll(stores.domainlist);
  let domainlistDB = {};
  let domain;
  for (let key in domainlistKeys) {
    domain = domainlistKeys[key];
    domainlistDB[domain] = domainlistValues[key];
  }
  // console.log("domainlist: ", domainlist);
  // console.log("domainlistDB: ", domainlistDB);

  for (let domainKey in domainlist) {
    if (!domainlistDB[domainKey]) {
      await storage.set(stores.domainlist, domainlist[domainKey], domainKey);
    }
  }

  for (let domainKey in domainlistDB) {
    if (!domainlist[domainKey]) {
      domainlist[domainKey] = domainlistDB[domainKey];
    }
  }
}


/******************************************************************************/
// Popup functions


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
    // console.log("dataToPopup: tabs[activeTabID].REQUEST_DOMAINS = ", requestsData)
    // console.log("activeTabID: ", activeTabID)
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


/******************************************************************************/
// Message passing

/**
 * This longtime connection is made specifically between the popup and the 
 * background page at the moment. 
 * The reason for this is I want to run our domainlist sync function when the 
 * popup itself is closed. The onDisconnect will help make this happen.
 * We need a port for this to work. Hence the function below. 
 */
chrome.runtime.onConnect.addListener(function(port) {
  console.log("PORT CONNECTED");
  if (port.name === "POPUP"
  //  || port.name === "OPTIONS_PAGE"
   ) {
    port.onDisconnect.addListener(function() {
      console.log("POPT DISCONNECTED");
      syncDomainlists();
    })
  }
})


/**
 * Listeners for information from --POPUP-- or --OPTIONS-- page
 * This is the main "hub" for message passing between the extension components
 * https://developer.chrome.com/docs/extensions/mv3/messaging/
 */
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  // console.log(`Recieved message @ background page.`);
  if (request.msg === "CHANGE_MODE") {
    // (1) enable/disable extension; (2) set cached mode; (3) set to storage;
    switch (request.data) {
      case modes.readiness.enabled:
        enable();
        mode = modes.readiness.enabled;
        await storage.set(stores.settings, modes.readiness.enabled, "MODE");
        break;
      case modes.readiness.domainlisted:
        enable();
        mode = modes.readiness.domainlisted;
        await storage.set(stores.settings, modes.readiness.domainlisted, "MODE");
        break;
      case modes.readiness.disabled:
        disable();
        mode = modes.readiness.disabled;
        await storage.set(stores.settings, modes.readiness.disabled, "MODE");
        break;
      default:
        console.error(`CHANGE_MODE failed, mode not recognized.`);
    }
  }
  if (request.msg === "SET_TO_DOMAINLIST") {
    let { domain, key } = request.data;
    domainlist[domain] = key;                     // Sets to cache
    storage.set(stores.domainlist, key, domain);  // Sets to long term storage
  }
  if (request.msg === "REMOVE_FROM_DOMAINLIST") {
    let domain = request.data;
    storage.delete(stores.domainlist, domain);
    delete domainlist[domain];
  }
  if (request.msg === "POPUP") {
    dataToPopup()
  }
  if (request.msg === "CONTENT_SCRIPT_WELLKNOWN") {
    let tabID = sender.tab.id;
    wellknown[tabID] = request.data
    if (wellknown[tabID]["gpc"] === true) {
      setTimeout(()=>{}, 10000);
      if (signalPerTab[tabID] === true) {
        chrome.browserAction.setIcon(
          {
            tabId: tabID,
            path: "assets/face-icons/optmeow-face-circle-green-128.png",
          },
          function () { /*console.log("Updated icon to SOLID GREEN.");*/ }
        );
      }
    }
  }

  if (request.msg === "CONTENT_SCRIPT_TAB") {
    // console.log("CONTENT_SCRIPT_TAB MESSAGE HAS BEEN RECEIVED")
    let url = new URL(sender.origin);
    let parsed = psl.parse(url.hostname);
    let domain = parsed.domain;
    let tabID = sender.tab.id;
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
      for (let key in urls) {
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
});


/******************************************************************************/
// Run-once-on-install functions

// Runs on startup to initialize the domainlist cache
pullToDomainlistCache();

// Runs on startup to initialize the cached current tab variable
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.id) {
    activeTabID = tab.id;
  }
});

// Listener for tab switch that updates the cached current tab variable
chrome.tabs.onActivated.addListener(function (info) {
  activeTabID = info.tabId;
  // dataToPopup()
});

// Opens the options page on extension install
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage((result) => {});
  }
});


/******************************************************************************/


export { 
  onBeforeSendHeaders, 
  onHeadersReceived, 
  onBeforeNavigate,
  onCommitted,
  dataToPopup
}

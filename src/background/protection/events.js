/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
events.js
================================================================================
events.js (1) Implements our per-site functionality for the background listeners
          (2) Handles cached values & message passing to popup & options page
*/


// import { enable, disable } from "./background.js"
import {
  // extensionMode, 
  stores, 
  storage 
} from "./../storage.js";
import { modes } from "../../data/modes.js";
import { defaultSettings } from "../../data/defaultSettings.js";
import { headers } from "../../data/headers.js";
import { initIAB } from "./cookiesIAB.js";
import { initCookiesPerDomain } from "./cookiesOnInstall.js";
import psl from "psl";

// Initializers (cached values)
var domainlist = {};    // Caches & mirrors domainlist in storage
var mode = defaultSettings["MODE"]; // Caches the extension mode
var isDomainlisted = defaultSettings["IS_DOMAINLISTED"];
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
    signalPerTab[details.tabId] = true;
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
  chrome.scripting.executeScript({
    files: ["dom.js"],
    target: {
      frameIds: [details.frameId],
      tabId: details.tabId, 
    },    // Supposed to solve multiple injections as opposed to allFrames: true
    // runAt: "document_start", // defaults to 'document_idle'
  });
}

/**
 * Checks whether a particular domain should receive a DNS signal
 * (1) Parse url to get domain for domainlist
 * (2) Update domains by adding current domain to domainlist in storage.
 * (3) Check to see if we should send signal.
 * @param {Object} details - callback object according to Chrome API
 */
function updateDomainlistAndSignal(details) {
  let url = new URL(details.url);
  let parsedUrl = psl.parse(url.hostname);
  let parsedDomain = parsedUrl.domain;

  let parsedDomainVal = domainlist[parsedDomain];
  if (parsedDomainVal === undefined) {
    storage.set(stores.domainlist, true, parsedDomain); // Sets to storage async
    domainlist[parsedDomain] = true;                    // Sets to cache
    parsedDomainVal = true;
  }

  (isDomainlisted) 
    ? ((parsedDomainVal === true) ? sendSignal = true : sendSignal = false)
    : sendSignal = true;
}

function updatePopupIcon(details) {
  // console.log(`TAB ID FOR UPDATEUI ${details.tabId}`)
  if (wellknown[details.tabId] === undefined) {
    wellknown[details.tabId] = null
  }
  if (wellknown[details.tabId] === null) {
    if ("$BROWSER" != "firefox") {
      chrome.action.setIcon(
        {
          tabId: details.tabId,
          path: "assets/face-icons/optmeow-face-circle-green-ring-128.png",
        },
        function () { /*console.log("Updated OptMeowt icon to GREEN RING");*/ }
      );
    } else {
      chrome.browserAction.setIcon(
        {
          tabId: details.tabId,
          path: "assets/face-icons/optmeow-face-circle-green-ring-128.png",
        },
        function () { /*console.log("Updated OptMeowt icon to GREEN RING");*/ }
      );
    }
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
chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  // console.log(`Recieved message @ background page.`);
  if (message.msg === "CHANGE_IS_DOMAINLISTED") {
    isDomainlisted = message.data.isDomainlisted;
    storage.set(stores.settings, isDomainlisted, "IS_DOMAINLISTED");
  }
  if (message.msg === "SET_TO_DOMAINLIST") {
    let { domain, key } = message.data;
    domainlist[domain] = key;                     // Sets to cache
    storage.set(stores.domainlist, key, domain);  // Sets to long term storage
  }
  if (message.msg === "REMOVE_FROM_DOMAINLIST") {
    let domain = message.data;
    storage.delete(stores.domainlist, domain);
    delete domainlist[domain];
  }
  if (message.msg === "POPUP") {
    dataToPopup()
  }
  if (message.msg === "CONTENT_SCRIPT_WELLKNOWN") {
    let tabID = sender.tab.id;
    wellknown[tabID] = message.data
    if (wellknown[tabID]["gpc"] === true) {
      setTimeout(()=>{}, 10000);
      if (signalPerTab[tabID] === true) {
        if ("$BROWSER" != "firefox") {
          chrome.action.setIcon(
            {
              tabId: tabID,
              path: "assets/face-icons/optmeow-face-circle-green-128.png",
            },
            function () { /*console.log("Updated icon to SOLID GREEN.");*/ }
          );
        } else  {
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
  }

  if (message.msg === "CONTENT_SCRIPT_TAB") {
    // console.log("CONTENT_SCRIPT_TAB MESSAGE HAS BEEN RECEIVED")
    let url = new URL(sender.origin);
    let parsed = psl.parse(url.hostname);
    let domain = parsed.domain;
    let tabID = sender.tab.id;
    if (tabs[tabID] === undefined) {
      tabs[tabID] = {
        DOMAIN: domain,
        REQUEST_DOMAINS: {},
        TIMESTAMP: message.data,
      };
    } else if (tabs[tabID].DOMAIN !== domain) {
      tabs[tabID].DOMAIN = domain;
      let urls = tabs[tabID]["REQUEST_DOMAINS"];
      // console.log("urls are:", urls)
      for (let key in urls) {
        if (urls[key]["TIMESTAMP"] >= message.data) {
          tabs[tabID]["REQUEST_DOMAINS"][key] = urls[key];
        } else {
          delete tabs[tabID]["REQUEST_DOMAINS"][key];
        }
      }

      tabs[tabID]["TIMESTAMP"] = message.data;
    }
  }
  if (message.msg === "SET_OPTOUT_COOKEIS") {
    // This is initialized when cookies are to be reset to a page after
    // do not sell is turned back on (e.g., when its turned on from the popup).

    // This is specifically for when cookies are removed when a user turns off
    // do not sell for a particular site, and chooses to re-enable it
    initCookiesPerDomain(message.data)
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



/******************************************************************************/


export { 
  onBeforeSendHeaders, 
  onHeadersReceived, 
  onBeforeNavigate,
  onCommitted,
  dataToPopup
}

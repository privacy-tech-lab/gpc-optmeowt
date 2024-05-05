/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
protection.js
================================================================================
protection.js (1) Implements our per-site functionality for the background listeners
          (2) Handles cached values & message passing to popup & options page
*/

import { stores, storage } from "./../storage.js";
import { defaultSettings } from "../../data/defaultSettings.js";
import { enableListeners, disableListeners } from "./listeners-$BROWSER.js";
import { initIAB } from "../cookiesIAB.js";
import { initCookiesPerDomain, deleteCookiesPerDomain } from "./cookiesOnInstall.js";
import { initCookiesOnInstall } from "./cookiesOnInstall.js";
import psl, { parse } from "psl";

import {
  addDynamicRule,
  deleteDynamicRule,
  reloadDynamicRules,
} from "../../common/editRules.js";

/******************************************************************************/
/******************************************************************************/
/**********             # Initializers (cached values)               **********/
/******************************************************************************/
/******************************************************************************/

var domainlist = {}; // Caches & mirrors domainlist in storage
var isDomainlisted = defaultSettings["IS_DOMAINLISTED"];
var tabs = {};          // Caches all tab infomration, i.e. requests, etc. 
var wellknown = {};     // Caches wellknown info to be sent to popup
var signalPerTab = {};  // Caches if a signal is sent to render the popup icon
var activeTabID = 0;    // Caches current active tab id
var sendSignal = true;  // Caches if the signal can be sent to the curr domain
var domPrev3rdParties = {}; //stores all the 3rd parties by domain (resets when you quit chrome)
var globalParsedDomain;
var setup = false;

async function reloadVars() {
  let storedDomainlisted = await storage.get(
    stores.settings,
    "IS_DOMAINLISTED"
  );
  if (storedDomainlisted) {
    isDomainlisted = storedDomainlisted;
  }
}

reloadVars();

/******************************************************************************/
/******************************************************************************/
/**********       # Lisetener callbacks - Main functionality         **********/
/******************************************************************************/
/******************************************************************************/

/*
 * The four following functions are all related to the four main listeners in
 * `background.js`. These four functions implement all the other helper
 * functions below
 */

const listenerCallbacks = {
  /**
   * Handles all signal processessing prior to sending request headers
   * @param {object} details - retrieved info passed into callback
   * @returns {array}
   */
  onBeforeSendHeaders: async (details) => {
    await updateDomainlist(details);
  },

  /**
   * @param {object} details - retrieved info passed into callback
   */
  onHeadersReceived: async (details) => {
    //if (!setup){
      //initSetup();
    //}
    await logData(details);
    await sendData();
    


  },

  /**
   * @param {object} details - retrieved info passed into callback
   */
  onBeforeNavigate: (details) => {
    // Resets certain cached info
  },

  /**
   * Adds DOM property
   * @param {object} details - retrieved info passed into callback
   */
  onCommitted: async (details) => {
    await updateDomainlist(details);
  },
  
  onCompleted: async (details) => {
    await sendData();
  }

}; // closes listenerCallbacks object

/******************************************************************************/
/******************************************************************************/
/**********      # Listener helper fxns - Main functionality         **********/
/******************************************************************************/
/******************************************************************************/


async function sendData(){
  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   if (tabs.id) {
  //     activeTabID = tabs.id;
  //   }
  // });

  let activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
  let activeTabID = activeTab.length > 0 ? activeTab[0].id : null;

  let currentDomain = await getCurrentParsedDomain(); 
  // console.log("activeTabID: ",activeTabID);
  // console.log("DP3P: ", domPrev3rdParties);
   console.log("tabs: ", tabs);
   console.log("activeTabID: ", activeTabID);
  // console.log("test test1: ", tabs[activeTabID]);
  // console.log("test test2: ", tabs[activeTabID]["REQUEST_DOMAINS"]);
  // console.log("test test3: ", tabs[activeTabID]["REQUEST_DOMAINS"][currentDomain]);
  let data = ["Please reload the site"];

  // if (activeTabID == 0){
  //   console.log("activeTabID is zero!!!");
  //   await chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //     console.log("tabs.id: ",tabs.id);
  //     if (tabs.id) {
  //       activeTabID = tabs.id;
  //     }
  //   });
  // }

  if (tabs[activeTabID] !== undefined) {
    let info = await tabs[activeTabID]["REQUEST_DOMAINS"];
    data = Object.keys(info);
  }

  //initialize the objects
  // if (!(activeTabID in domPrev3rdParties)){
  //   domPrev3rdParties[activeTabID] = {};
  // }
  // if (!(currentDomain in domPrev3rdParties[activeTabID]) ){
  //   domPrev3rdParties[activeTabID][currentDomain] = {};
  // }
  // //as they come in, add the parsedDomain to the object with null value (just a placeholder)
  // domPrev3rdParties[activeTabID][currentDomain][parsedDomain] = null;

  //let data = JSON.stringify(data);
  console.log("setting to storage under ", currentDomain, ": ", data);
  await storage.set(stores.thirdParties, data, currentDomain);
}


function getCurrentParsedDomain() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];
        let url = new URL(tab.url);
        let parsed = psl.parse(url.hostname);
        let domain = parsed.domain;
        globalParsedDomain = domain;  // for global scope variable
        resolve(domain);
      });
    } catch(e) {
      reject();
    }
  })
}


/**
 * Checks whether a particular domain should receive a DNS signal
 * (1) Parse url to get domain for domainlist
 * (2) Update domains by adding current domain to domainlist in storage.
 * (3) Updates the 3rd party list for the currentDomain
 * (4) Check to see if we should send signal.
 * 
 * Currently, it only adds to domainlist store as NULL if it doesnt exist
 * @param {Object} details - callback object according to Chrome API
 */
async function updateDomainlist(details) {
  let url = new URL(details.url);
  let parsedUrl = psl.parse(url.hostname);
  let parsedDomain = parsedUrl.domain;
  let currDomainValue = await storage.get(stores.domainlist, parsedDomain);

  if (currDomainValue === undefined) {
    await storage.set(stores.domainlist, null, parsedDomain); // Sets to storage async
  }
  
  //get the current parsed domain--this is used to store 3rd parties (using globalParsedDomain variable)
  
}

function updatePopupIcon(tabId) {
  chrome.action.setIcon({
    tabId: tabId,
    path: "assets/face-icons/optmeow-face-circle-green-ring-128.png",
  });
}

async function logData(details) {
  let url = new URL(details.url);
  let parsed = psl.parse(url.hostname);

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

async function pullToDomainlistCache() {
  let domain;
  let domainlistKeys = await storage.getAllKeys(stores.domainlist);
  let domainlistValues = await storage.getAll(stores.domainlist);

  for (let key in domainlistKeys) {
    domain = domainlistKeys[key];
    domainlist[domain] = domainlistValues[key];
  }
}

async function syncDomainlists() {
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

/**
 * whether the curr site should get privacy signals
 * (We need to try and make a synchronous version, esp. for DOM issue & related
 * message passing with the contentscript which injects the DOM signal)
 * @returns {bool} sendSignal
 */
async function sendPrivacySignal(domain) {
  let sendSignal;
  const extensionEnabled = await storage.get(stores.settings, "IS_ENABLED");
  const extensionDomainlisted = await storage.get(
    stores.settings,
    "IS_DOMAINLISTED"
  );
  const domainDomainlisted = await storage.get(stores.domainlist, domain);

  if (extensionEnabled) {
    if (extensionDomainlisted) {
      // Recall we must flip the value of the domainlisted domain
      // due to how to how defined domainlisted values, corresponding to MV3
      // declarativeNetRequest rule exceptions
      // (i.e., null => no rule exists, valued => exception rule exists)
      sendSignal = !domainDomainlisted ? true : false;
    } else {
      sendSignal = true;
    }
  } else {
    sendSignal = false;
  }
  return sendSignal;
}

/******************************************************************************/
/******************************************************************************/
/**********          # Message Passing - Popup helper fxns           **********/
/******************************************************************************/
/******************************************************************************/

function handleSendMessageError() {
  const error = chrome.runtime.lastError;
  if (error) {
    console.warn(error.message);
  }
}
async function dataToPopupHelper(){
  //data gets sent back every time the popup is clicked
  let requestsData = {};

  console.log("data to popup helper called");
  
  //if (tabs[activeTabID] !== undefined) {
    let domain = await getCurrentParsedDomain();
    let parties = await storage.get(stores.thirdParties, "parties");
    parties = JSON.parse(parties);
    console.log("parties: ", parties[domain]);
    
    requestsData = parties[domain];
    console.log("request data: ", requestsData);
  //}
  return requestsData
}

// Info back to popup
async function dataToPopup(wellknownData) {
  console.log("datatopopup called");
  let requestsData = await dataToPopupHelper(); //get requests from the helper
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    let popupData = {
      requests: requestsData,
      wellknown: wellknownData,
    };

    chrome.runtime.sendMessage(
      {
        msg: "POPUP_PROTECTION_DATA",
        data: popupData,
      },
      handleSendMessageError
    );
  });
}

async function dataToPopupRequests() {
  console.log("datatopopuprequests called");
  let requestsData = await dataToPopupHelper(); //get requests from the helper
  console.log("requests data in DTPR: ", requestsData)

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.runtime.sendMessage(
      {
        msg: "POPUP_PROTECTION_DATA_REQUESTS",
        data: requestsData,
      },
      handleSendMessageError
    );
  });
}

/******************************************************************************/
/******************************************************************************/
/**********                   # Message passing                      **********/
/******************************************************************************/
/******************************************************************************/

/**
 * Currently only handles syncing domainlists between storage and memory
 * This runs when the popup disconnects from the background page
 * @param {Port} port
 */
function onConnectHandler(port) {
  if (port.name === "POPUP") {
    port.onDisconnect.addListener(function () {
      syncDomainlists();
    });
  }
}

/**
 * This is currently only to handle adding the GPC DOM signal.
 * I'm not sure how to fit it into an async call, it doesn't want to connect.
 * It would be nice to merge the two onMessage handlers.
 * TODO: This method still seems to have a timing issue. Doesn't always show DOM signal as thumbs up on reference site.
 * @returns {Bool} true (lets us send asynchronous responses to senders)
 */
function onMessageHandlerSynchronous(message, sender, sendResponse) {
  if (message.msg === "APPEND_GPC_PROP") {
    let url = new URL(sender.origin);
    let parsed = psl.parse(url.hostname);
    let domain = parsed.domain;

    const r = sendPrivacySignal(domain);
    r.then((r) => {
      const response = {
        msg: "APPEND_GPC_PROP_RESPONSE",
        sendGPC: r,
      };
      sendResponse(response);
    });
  }
  //return true;
}

/**
 * Listeners for information from --POPUP-- or --OPTIONS-- page
 * This is the main "hub" for message passing between the extension components
 * https://developer.chrome.com/docs/extensions/mv3/messaging/
 */
async function onMessageHandlerAsync(message, sender, sendResponse) {
  if (message.msg === "CHANGE_IS_DOMAINLISTED") {
    let isDomainlisted = message.data.isDomainlisted;
    storage.set(stores.settings, isDomainlisted, "IS_DOMAINLISTED");
  }
  if (message.msg === "SET_TO_DOMAINLIST") {
    let { domain, key } = message.data;
    domainlist[domain] = key; // Sets to cache
    addDynamicRule(id, domain);
    storage.set(stores.domainlist, key, domain); // Sets to long term storage
  }
  if (message.msg === "POPUP_PROTECTION_REQUESTS") {
    console.log("info queried");
    await dataToPopupRequests();
  }
  if (message.msg === "CONTENT_SCRIPT_WELLKNOWN") {
    // sender.origin not working for Firefox MV3, instead added a new message argument, message.origin_url
    //let url = new URL(sender.origin);
    let url = new URL(message.origin_url);
    let parsed = psl.parse(url.hostname);
    let domain = parsed.domain;

    let tabID = sender.tab.id;
    let wellknown = [];
    let sendSignal = await storage.get(stores.domainlist, domain);

    wellknown[tabID] = message.data;
    let wellknownData = message.data;

    console.log("setting WKD at ", domain, ": ", wellknownData);
    await storage.set(stores.wellknownInformation, wellknownData, domain);

    //await sendData();

    initIAB(!sendSignal);

    if (wellknown[tabID] === null && sendSignal == null) {
      updatePopupIcon(tabID);
    } else if (wellknown[tabID]["gpc"] === true && sendSignal == null) {
      chrome.action.setIcon({
        tabId: tabID,
        path: "assets/face-icons/optmeow-face-circle-green-128.png",
      });
    }
    chrome.runtime.onMessage.addListener(async function (message, _, __) {
      if (message.msg === "POPUP_PROTECTION") {
        await dataToPopup(wellknownData);
      }
    });
  }

  if (message.msg === "CONTENT_SCRIPT_TAB") {
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
  if (message.msg === "SET_OPTOUT_COOKIES") {
    // This is initialized when cookies are to be reset to a page after
    // do not sell is turned back on (e.g., when its turned on from the popup).

    // This is specifically for when cookies are removed when a user turns off
    // do not sell for a particular site, and chooses to re-enable it
    initCookiesPerDomain(message.data);
  }
  if (message.msg === "DELETE_OPTOUT_COOKIES") {
    deleteCookiesPerDomain(message.data);
  }

  return true; // Async callbacks require this
}

function initMessagePassing() {
  chrome.runtime.onConnect.addListener(onConnectHandler);
  chrome.runtime.onMessage.addListener(onMessageHandlerAsync);
  chrome.runtime.onMessage.addListener(onMessageHandlerSynchronous);
}

function closeMessagePassing() {
  chrome.runtime.onConnect.removeListener(onConnectHandler);
  chrome.runtime.onMessage.removeListener(onMessageHandlerAsync);
  chrome.runtime.onMessage.removeListener(onMessageHandlerSynchronous);
}

/******************************************************************************/
/******************************************************************************/
/**********       # Other initializers - run once per enable         **********/
/******************************************************************************/
/******************************************************************************/

/**
 * Listener for tab switch that updates the cached current tab variable
 */
function onActivatedProtectionMode(info) {
  activeTabID = info.tabId;
  console.log("onActivatedProtectionMode called");
}

// Handles misc. setup & setup listeners
function initSetup() {
  pullToDomainlistCache();

  // Runs on startup to initialize the cached current tab variable
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.id) {
      activeTabID = tabs.id;
    }
  });

  chrome.tabs.onActivated.addListener(onActivatedProtectionMode);
  setup = true;
}

function closeSetup() {
  chrome.tabs.onActivated.removeListener(onActivatedProtectionMode);
}

/**
 * Inteded to facilitate transitioning between analysis & protection modes
 */
function wipeLocalVars() {
  domainlist = {}; // Caches & mirrors domainlist in storage
  tabs = {}; // Caches all tab infomration, i.e. requests, etc.
  wellknown = {}; // Caches wellknown info to be sent to popup
  signalPerTab = {}; // Caches if a signal is sent to render the popup icon
  activeTabID = 0; // Caches current active tab id
  sendSignal = false; // Caches if the signal can be sent to the curr domain
}

/******************************************************************************/
/******************************************************************************/
/**********           # Exportable init / halt functions             **********/
/******************************************************************************/
/******************************************************************************/

export function init() {
  reloadVars();
  initCookiesOnInstall(); // NOTE: This replaces ALL do not sell cookies
  enableListeners(listenerCallbacks);
  initMessagePassing();
  initSetup();
}

export function halt() {
  disableListeners(listenerCallbacks);
  closeMessagePassing();
  closeSetup();
  wipeLocalVars();
}

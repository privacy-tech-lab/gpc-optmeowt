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
import psl from "psl";

import {
  addDynamicRule,
  deleteDynamicRule,
  reloadDynamicRules,
} from "../../common/editRules.js";
import { isWellknownCheckEnabled, isComplianceCheckEnabled, getUserState } from "../../common/settings.js";
import { fetchComplianceData, isCacheValid } from "../../data/complianceData.js";

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
var complianceCache = null; // Caches fetched compliance data
var complianceFetchedAt = null; // Timestamp of last fetch
var complianceCachedState = null; // State code the cache was fetched for

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
    await handleComplianceCheck(details);
  }

}; // closes listenerCallbacks object

/******************************************************************************/
/******************************************************************************/
/**********      # Listener helper fxns - Main functionality         **********/
/******************************************************************************/
/******************************************************************************/


/**
 * Fetches compliance data if not cached or cache is stale
 * @returns {Promise<Object|null>} - Compliance data map or null if disabled/error
 */
async function getComplianceData() {
  const stateCode = await getUserState();
  if (!stateCode || stateCode === 'none') {
    return null;
  }

  // Invalidate cache if state changed
  if (complianceCachedState && complianceCachedState !== stateCode) {
    complianceCache = null;
    complianceFetchedAt = null;
    complianceCachedState = null;
    await storage.clear(stores.complianceData);
  }

  // Check if we have valid cached data
  if (complianceCache && isCacheValid(complianceFetchedAt)) {
    return complianceCache;
  }

  // Fetch fresh data for the selected state
  try {
    const result = await fetchComplianceData(stateCode);
    complianceCache = result.data;
    complianceFetchedAt = result.fetchedAt;
    complianceCachedState = stateCode;

    // Store metadata in storage
    await storage.set(stores.complianceData, {
      fetchedAt: result.fetchedAt,
      count: result.count,
      stateCode
    }, '_metadata');

    console.log(`Fetched ${stateCode} compliance data for ${result.count} domains`);
    return complianceCache;
  } catch (error) {
    console.error('Failed to fetch compliance data:', error);
    return null;
  }
}

/**
 * Looks up and stores compliance status for current domain after page load
 * @param {Object} details - callback object from onCompleted listener
 */
async function handleComplianceCheck(details) {
  // Only check main frame navigations
  if (details.frameId !== 0) return;

  const stateCode = await getUserState();
  if (!stateCode || stateCode === 'none') {
    return;
  }

  try {
    const url = new URL(details.url);
    const parsed = psl.parse(url.hostname);
    const domain = parsed.domain;

    if (!domain) return;

    console.log('Running compliance check for:', domain);

    const complianceData = await getComplianceData();
    if (!complianceData) {
      console.log('No compliance data available');
      return;
    }

    const status = complianceData[domain] || {
      status: 'no_data',
      details: 'This site was not included in the crawl dataset',
      lastChecked: null
    };

    console.log('Compliance status for', domain, ':', status.status);

    // Store in IndexedDB for popup to access
    await storage.set(stores.complianceData, status, domain);
  } catch (error) {
    console.debug('Error in compliance check:', error);
  }
}

async function sendData() {
  let activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
  let activeTabID = activeTab.length > 0 ? activeTab[0].id : null;

  if (activeTabID === null) {
    return;
  }

  let currentDomain = await getCurrentParsedDomain();
  if (!currentDomain) {
    return;
  }

  const partiesForTab = domPrev3rdParties?.[activeTabID];
  const info = partiesForTab ? partiesForTab[currentDomain] : null;

  if (!info) {
    await storage.delete(stores.thirdParties, currentDomain);
    return;
  }

  const data = Object.keys(info).filter(Boolean);
  await storage.set(stores.thirdParties, data, currentDomain);

}


function getCurrentParsedDomain() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      try {
        const tab = tabs && tabs[0];
        if (!tab || !tab.url) {
          return resolve(null);
        }
        const url = new URL(tab.url);
        const parsed = psl.parse(url.hostname);
        const domain = parsed && parsed.domain ? parsed.domain : null;
        globalParsedDomain = domain;  // for global scope variable
        resolve(domain);
      } catch (e) {
        resolve(null);
      }
    });
  });
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
  if (!details || !details.url) {
    return;
  }

  let parsedDomain;
  try {
    let url = new URL(details.url);
    let parsedUrl = psl.parse(url.hostname);
    parsedDomain = parsedUrl.domain;
  } catch (e) {
    return;
  }

  if (!parsedDomain) {
    return;
  }

  let currDomainValue = await storage.get(stores.domainlist, parsedDomain);
  let id = details.tabId;

  if (currDomainValue === undefined) {
    await storage.set(stores.domainlist, null, parsedDomain); // Sets to storage async
  }

  let currentDomain = await getCurrentParsedDomain();
  if (!currentDomain) {
    return;
  }

  //get the current parsed domain--this is used to store 3rd parties (using globalParsedDomain variable)
  if (!(id in domPrev3rdParties)) {
    domPrev3rdParties[id] = {};
  }
  if (!(currentDomain in domPrev3rdParties[id])) {
    domPrev3rdParties[id][currentDomain] = {};
  }
  //as they come in, add the parsedDomain to the object with null value (just a placeholder)
  domPrev3rdParties[id][currentDomain][parsedDomain] = null;


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
async function dataToPopupHelper() {
  //data gets sent back every time the popup is clicked
  let domain = await getCurrentParsedDomain();
  if (!domain) {
    return [];
  }

  let parties = await storage.get(stores.thirdParties, domain);
  if (!Array.isArray(parties)) {
    return [];
  }

  return parties;
}

// Info back to popup
async function dataToPopup(wellknownData) {
  let requestsData = await dataToPopupHelper(); //get requests from the helper
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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
  if (message.msg === "GET_WELLKNOWN_CHECK_ENABLED") {
    const enabled = await isWellknownCheckEnabled();
    await chrome.storage.local.set({ WELLKNOWN_CHECK_ENABLED: enabled });
    sendResponse({ enabled });
    return true;
  }
  if (message.msg === "TOGGLE_WELLKNOWN_CHECK") {
    const enabled = message.data?.enabled !== false;
    await storage.set(stores.settings, enabled, "WELLKNOWN_CHECK_ENABLED");
    await chrome.storage.local.set({ WELLKNOWN_CHECK_ENABLED: enabled });
    if (!enabled) {
      await storage.clear(stores.wellknownInformation);
      wellknown = {};
    }
  }
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
    const wellknownCheckEnabled = await isWellknownCheckEnabled();
    if (!wellknownCheckEnabled) {
      return true;
    }
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

    await storage.set(stores.wellknownInformation, wellknownData, domain);

    //await sendData();

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

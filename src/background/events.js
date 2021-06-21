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
  return addHeaders(details);
}

/**
 * @param {object} details - retrieved info passed into callback
 */
const onHeadersReceived = (details) => {
  // logData(details);
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

function updateDomainsAndSignal(details) {
  /// Add current domain to list of domains to send headers to on current tab
  var url = new URL(details.url);
  var parsed = psl.parse(url.hostname);
  var d = parsed.domain;
  global_domains[d] = true;

  chrome.storage.local.get(["DOMAINLIST_ENABLED", "DOMAINS"], function (
    result
  ) {
    var domains = result.DOMAINS;
    // console.log("domains is:", domains, "when global_domains is:", global_domains);
  
    /// Add each domain in gloabl_domains to the chrome domain list
    /// This ensures that all domains on the page are added to the domain list 
    /// if they haven't been already added
    for (const domain in global_domains) {
      if (domains[domain] === undefined) {
        domains[domain] = true;
      }
    }
  
    chrome.storage.local.set({ DOMAINS: domains }, function(){
      // console.log("setting the storage for domain:", d);
    });
  
    // console.log("parsed domain in updateDomain is:", d, "domains[d] is:", domains[d], "domains is:", domains);
  
    /// Set to true if domainlist is off, or if domainlist is on
    /// AND domain is in domainlist
    /// Basically, we want to know if we send the signal to a given domain
    if (result.DOMAINLIST_ENABLED) {
      if (domains[d] === true) {
        sendSignal = true;
        // console.log("set sendSignal to TRUE for domain:", d);
      } else {
        // console.log("set sendSignal to false for domain:", d);
        sendSignal = false;
      }
    } else {
      // console.log("set sendSignal to TRUE for domain:", d);
      sendSignal = true; /// Always send signal to all domains
    }
    // console.log("sendsignal:", sendSignal);
  })
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
  
function incrementBadge() {
  let numberOfRequests = 0;
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
  // chrome.browserAction.setBadgeText({ text: numberOfRequests.toString() });
  function handleSendMessageError() {
    const error = chrome.runtime.lastError;
    if (error){
      console.warn(error.message)
    }
  }
  
  chrome.runtime.sendMessage({
    msg: "BADGE",
    data: numberOfRequests.toString(),
  }, handleSendMessageError);
  chrome.runtime.sendMessage({
    msg: "REQUESTS",
    data: requests,
  }, handleSendMessageError);
}


export { 
  onBeforeSendHeaders, 
  onHeadersReceived, 
  onBeforeNavigate,
  onCommitted
}
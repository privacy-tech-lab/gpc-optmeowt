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

import { headers } from "./headers.js"

// attach headers before headers are sent with request
const onBeforeSendHeaders = (details) => {
  return updateHeaders(details);
}

const onHeadersReceived = (details) => {
  // logData(details);
  // incrementBadge(details);
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
  
  
function updateHeaders(details) {
  // if (sendSignal) {
    for (var signal in headers) {
      let s = headers[signal];
      // console.log(s);
      details.requestHeaders.push({ name: s.name, value: s.value });
      // console.log("Sending signal added for url:", details.url, "signal:", s.name, s.value);
    }
    return { requestHeaders: details.requestHeaders };
  // } else {
  //   // console.log("Preparing to send no added signal...", details.requestHeaders);
  //   return { requestHeaders: details.requestHeaders };
  // }
}
  
function initDomJS(details) {
  // console.log("Initializing DOM signal...")
  chrome.tabs.executeScript(details.tabId, {
    file: "dom.js",
    frameId: details.frameId, // Supposed to solve multiple injections
                              // as opposed to allFrames: true
    runAt: "document_start",
  });
}

function onBeforeNavigate(details) {
}
  
// add DOM property
function onCommitted(details) {
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
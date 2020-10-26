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

import { YAML } from "/libs/yaml-1.10.0/index.js";

/**
 * Initializers
 */
var tabs = {}; /// Store all active tab id's, domain, requests, and response
var activeTabID = 0;
var sendSignal = false;
var optout_headers = {};
var userAgent = window.navigator.userAgent

/**
 * Manipulates Headers and adds Do Not Sell signal if functionality is on
 * @param {Object} details - retrieved info passed into callback
 * @return {HttpHeaders} array of modified HTTP headers to be sent
 *                       (request headers)
 */
var addHeaders = (details) => {
  if (!(details.type === "image")) {
    console.log(`the type is -> ${details.type}, ${typeof details.type}`);
    updateDomainsAndSignal(details);

    if (sendSignal) {
      initUSP();
      updateUI(details);
      return updateHeaders(details);
    }
  } else {
    console.log("Caught unessential request");
  }
};

/**
 * Manipulates received headers if need be. Logs data and updates popup badge
 * @param {Object} details - retrieved info passed into callback
 */
var receivedHeaders = (details) => {
  logData(details);
  incrementBadge(details);
};

/**
 * Adds current domain to local storage domain list.
 * Verifies a signal should be sent to a particular domain and sets
 * `sendSignal` bool flag accordingly.
 * @param {Object} details - retrieved info passed into callback
 */
function updateDomainsAndSignal(details) {
  chrome.storage.local.get(["DOMAINLIST_ENABLED", "DOMAINS"], function (
    result
  ) {
    /// Store current domain in DOMAINS
    var url = new URL(details.url);
    var parsed = psl.parse(url.hostname);
    var d = parsed.domain;
    var domains = result.DOMAINS;
    console.log(d);

    if (domains[d] === undefined) {
      domains[d] = true;
      chrome.storage.local.set({ DOMAINS: domains });
      console.log("Stored current domain");
    }
    /// Set to true if domainlist is off, or if domainlist is on
    /// AND domain is in domainlist
    /// Basically, we want to know if we send the signal to a given domain
    if (result.DOMAINLIST_ENABLED) {
      if (domains[d] === true) {
        sendSignal = true;
      } else {
        sendSignal = false;
      }
    } else {
      sendSignal = true; /// Always send signal to all domains
    }
    console.log(sendSignal);
  });
}

/**
 * Updates HTTP headers with Do Not Sell headers according
 * to whether or not a site should recieve them.
 * @param {Object} details - details object
 */
function updateHeaders(details) {
  if (sendSignal) {
    for (var signal in optout_headers) {
      let s = optout_headers[signal];
      console.log(s);
      details.requestHeaders.push({ name: s.name, value: s.value });
      console.log("Sending signal added...", s.name, s.value);
    }
    return { requestHeaders: details.requestHeaders };
  } else {
    console.log("Preparing to send no added signal...", details.requestHeaders);
    return { requestHeaders: details.requestHeaders };
  }
}

/**
 * Initializes the GPC dom signal functionality in dom.js
 * Places a globalPrivacyControl property on the window object
 * @param {Object} details - details object
 */
function initDomJS(details) {
  chrome.tabs.executeScript(details.tabId, {
    file: "dom.js",
    allFrames: true,
    runAt: "document_start",
  });
}

/**
 * Checks to see if DOM signal should be set, then inits DOM signal set
 * @param {Object} details  - retrieved info passed into callback
 */
function addDomSignal(details) {
  updateDomainsAndSignal(details);
  if (sendSignal) {
    initDomJS(details);
  }
}

/**
 * Updates OptMeowt icon to reflect a Do Not Sell signal sent status
 * @param {Object} details - retrieved info passed into callback
 */
function updateUI(details) {
  chrome.browserAction.setIcon(
    {
      tabId: details.tabId,
      path: "assets/face-icons/optmeow-face-circle-green-128.png",
    },
    function () {
      console.log("Updated OptMeowt icon to GREEN");
    }
  );
}

/**
 * Logs all urls of a domain with response headers to local `tabs` object
 * @param {Object} details - retrieved info passed into callback
 */
function logData(details) {
  var url = new URL(details.url);
  var parsed = psl.parse(url.hostname);
  console.log("Details.responseHeaders: ", details.responseHeaders);

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

/**
 * Counts and stores requests for popup window, and sends "BADGE" and
 * "REQUESTS" messages to popup.js
 */
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
    console.log(tabs[activeTabID]);
  }
  // chrome.browserAction.setBadgeText({ text: numberOfRequests.toString() });
  try {
    chrome.runtime.sendMessage({
      msg: "BADGE",
      data: numberOfRequests.toString(),
    })
    chrome.runtime.sendMessage({
      msg: "REQUESTS",
      data: requests,
    })
  } catch (error) {
    return;
  }
  
}

/**
 * Enables extension functionality and sets site listeners
 */
function enable() {
  // fetches new optout_headers on load
  fetch("yaml/headers.yaml")
    .then((response) => {
      return response.text();
    })
    .then((value) => {
      optout_headers = YAML.parse(value);
      console.log(optout_headers);
      // Headers
      var extraSpec;
      var domFilter;
      if (userAgent !== null && userAgent.indexOf("Firefox") > -1){
        extraSpec = ["requestHeaders", "blocking"]
      } else {
        extraSpec = ["requestHeaders", "extraheaders", "blocking"];
        domFilter = {
          urls: ["<all_urls>"],
        }
      }
      chrome.webRequest.onBeforeSendHeaders.addListener(
        addHeaders,
        {
          urls: ["<all_urls>"],
        },
        extraSpec
      );
      chrome.storage.local.set({ ENABLED: true });

      // DOM signal to navigator
      chrome.webNavigation.onCommitted.addListener(
        addDomSignal,
        domFilter
      )

      chrome.webRequest.onHeadersReceived.addListener(
        receivedHeaders,
        {
          urls: ["<all_urls>"],
        },
        extraSpec
      );
      // chrome.browserAction.setBadgeBackgroundColor({ color: "#666666" });
      // chrome.browserAction.setBadgeText({ text: "0" });
      chrome.storage.local.set({ ENABLED: true });
    })
    .catch((e) =>
      console.log(
        `Failed to intialize OptMeowt (YAML load process) (ContentScript): ${e}`
      )
    );
}

/**
 * Disables extension functionality
 */
function disable() {
  optout_headers = {};
  chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
  chrome.webRequest.onBeforeSendHeaders.removeListener(receivedHeaders);
  chrome.webNavigation.onCommitted.removeListener(addDomSignal)
  chrome.storage.local.set({ ENABLED: false });
  // chrome.browserAction.setBadgeText({ text: "" });
  var counter = 0;
}

/**
 * Listener for tab switch that updates curr tab badge counter
 */
chrome.tabs.onActivated.addListener(function (info) {
  activeTabID = info.tabId;
  incrementBadge();
});

/**
 * Runs on startup to query current tab
 */
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.id !== undefined) {
    activeTabID = tab.id;
  }
});

/**
 * Generates ENABLED, DOMAINLIST_ENABLED, and DOMAINS keys in local storage
 * if undefined
 */
chrome.storage.local.get(
  ["ENABLED", "DOMAINLIST_ENABLED", "DOMAINS", "DOMAINLIST_PRESSED"],
  function (result) {
    if (result.ENABLED == undefined) {
      chrome.storage.local.set({ ENABLED: true });
    }
    if (result.DOMAINLIST_ENABLED == undefined) {
      chrome.storage.local.set({ DOMAINLIST_ENABLED: false });
    }
    if (result.DOMAINS == undefined) {
      chrome.storage.local.set({ DOMAINS: {} });
    }
    if (result.DOMAINLIST_PRESSED == undefined) {
      chrome.storage.local.set({ DOMAINLIST_PRESSED: false });
    }
  }
);

/**
 * Runs on startup to enable/disable extension
 */
chrome.storage.local.get(["ENABLED"], function (result) {
  if (result.ENABLED === false) {
    disable();
  } else {
    enable();
  }
});

/**
 * Listener for runtime messages, in partuclar "TAB" from contentScript.js
 * or for "INIT" to start popup badge counter
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.ENABLED != null) {
    if (request.ENABLED) {
      enable();
      sendResponse("DONE");
    } else {
      disable();
      sendResponse("DONE");
    }
  }
  if (request.msg === "WELLKNOWN") {
    console.log(`.well-known from ContentScr: ${JSON.stringify(request.data)}`);
  }
  if (request.msg === "TAB") {
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
      for (var key in urls) {
        if (urls[key]["TIMESTAMP"] >= request.data) {
          tabs[tabID]["REQUEST_DOMAINS"][key] = urls[key];
        } else {
          delete tabs[tabID]["REQUEST_DOMAINS"][key];
        }
      }
      tabs[tabID]["TIMESTAMP"] = request.data;
    }
  } else if (request.msg == "INIT") {
    incrementBadge();
  }
});

chrome.runtime.onInstalled.addListener(function (object) {
  chrome.storage.local.set(
    { FIRSTINSTALL: true, FIRSTINSTALL_POPUP: true },
    function () {
      console.log("Set fresh install value. Opening options page...");
      chrome.runtime.openOptionsPage(() => console.log("Opened options page."));
    }
  );
});

/*
*
*
We could use this to get and update the tab url, but it requires this
demanding permission in manifest
*
*
"permissions": [
    "tabs"
]
*
*
The content script approach only uses the activeTab permission. If the
conent script approach is not working or if you feel this is better,
you are welcome to switch
*
*
chrome.tabs.onUpdated.addListener(function(){
  chrome.tabs.getSelected(null,function(tab) {//get current tab without any selectors
      alert(tab.url);  //get tab value 'url'
  });
});
*/

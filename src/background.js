/*
Initializers
*/
tabs = {}; /// Store all active tab id's, domain, requests, and response
activeTabID = 0;

/// Manipulate Headers
addHeaders = (details) => {
  details.requestHeaders.push({ name: "DNS", value: "0" });
  return { requestHeaders: details.requestHeaders };
};

/// Manipulate received headders if need be.
receivedHeaders = (details) => {
  logData(details);
  incrementBadge(details);
};

/// Logs all urls of a domain with response headers
function logData(details) {
  if (tabs[details.tabId] === undefined) {
    tabs[details.tabId] = { DOMAIN: null, URLS: {}, TIMESTAMP: 0 };
    tabs[details.tabId].URLS[details.url] = {
      RESPONSE: details.responseHeaders,
      TIMESTAMP: details.timeStamp,
    };
  } else {
    tabs[details.tabId].URLS[details.url] = {
      RESPONSE: details.responseHeaders,
      TIMESTAMP: details.timeStamp,
    };
  }
}

/// Increment badge number
function incrementBadge() {
  let numberOfRequests = 0;
  let requests = {}
  if (tabs[activeTabID] !== undefined) {
    numberOfRequests = Object.keys(tabs[activeTabID].URLS).length;
    requests = tabs[activeTabID].URLS
  }
  chrome.browserAction.setBadgeText({ text: numberOfRequests.toString() });
  chrome.runtime.sendMessage({
    msg: "BADGE",
    data: numberOfRequests.toString(),
  });
  chrome.runtime.sendMessage({
    msg: "REQUESTS",
    data: requests,
  });
}

/// Enable extension funtionality
function enable() {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    addHeaders,
    {
      urls: ["<all_urls>"],
    },
    ["requestHeaders", "extraHeaders", "blocking"]
  );
  chrome.storage.local.set({ ENABLED: true });

  chrome.webRequest.onHeadersReceived.addListener(
    receivedHeaders,
    {
      urls: ["<all_urls>"],
    },
    ["responseHeaders", "extraHeaders" /*, "blocking"*/]
  );
  chrome.browserAction.setBadgeBackgroundColor({ color: "#666666" });
  chrome.browserAction.setBadgeText({ text: "0" });
  chrome.storage.local.set({ ENABLED: true });
}

/// Disable extenstion functionality
function disable() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
  chrome.webRequest.onBeforeSendHeaders.removeListener(receivedHeaders);
  chrome.storage.local.set({ ENABLED: false });
  chrome.browserAction.setBadgeText({ text: "" });
  counter = 0;
}

chrome.tabs.onActivated.addListener(function (info) {
  activeTabID = info.tabId;
  incrementBadge()
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.id !== undefined) {
    activeTabID = tab.id;
  }
});

chrome.storage.local.get(["ENABLED"], function (result) {
  if (result.ENABLED == undefined) {
    chrome.storage.local.set({ ENABLED: true });
    enable();
  } else if (result.ENABLED) {
    enable();
  } else {
    disable();
  }
});

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
  if (request.msg === "TAB") {
    var url = new URL(sender.origin);
    var domain = url.hostname;
    var tabID = sender.tab.id;
    if (tabs[tabID] === undefined) {
      tabs[tabID] = { DOMAIN: domain, URLS: {}, TIMESTAMP: request.data };
    } else if (tabs[tabID].DOMAIN !== domain) {
      tabs[tabID].DOMAIN = domain;
      let urls = tabs[tabID]["URLS"];
      for (var key in urls) {
        if (urls[key]["TIMESTAMP"] >= request.data) {
          tabs[tabID]["URLS"][key] = urls[key];
        } else {
          delete tabs[tabID]["URLS"][key];
        }
      }
      tabs[tabID]["TIMESTAMP"] = request.data;
    }
  } else if (request.msg == "INIT") {
    incrementBadge();
  }
});

/*
*
*
We could use this to get and update the tab url, but it requires this demanding permission in manifest
*
*
"permissions": [
    "tabs"
]
*
*
The content script approach only uses the activeTab permission. If the conent script approach is not working
or if you feel this is better, you are welcome to switch
*
*
chrome.tabs.onUpdated.addListener(function(){
  chrome.tabs.getSelected(null,function(tab) {//get current tab without any selectors
      alert(tab.url);  //get tab value 'url'
  });
});
*/

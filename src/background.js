/*
Initializers
*/
tabs = {}; /// Store all active tab id's, domain, requests, and response
activeTabID = 0;

/// Manipulate Headers
addHeaders = (details) => {
  storeDomains(details);
  details.requestHeaders.push({ name: "DNS", value: "0" });
    console.log("TEST: Pushed DNS signal");
  return { requestHeaders: details.requestHeaders };
};

/// Manipulate received headers if need be.
receivedHeaders = (details) => {
  logData(details);
  incrementBadge(details);
};

/// Checks if current domain name is whitelisted
checkWhitelist = (details) => {
  chrome.storage.local.get(["DOMAINS", "WHITELIST_ENABLED"], function (result) {
    if (result.WHITELIST_ENABLED) {
      if (result.DOMAINS[details.initiator] == true) {
        inWhitelist = true
      } else {
        inWhitelist = false
      }
    } else {
      inWhitelist = false
    }
    console.log(inWhitelist)
    enable(inWhitelist)
  })
}

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

/// Adds requested domain name to DOMAINS
function storeDomains (details) {
  chrome.storage.local.get(["DOMAINS", "NONWHITELIST"], function (result) {
    var d = details.initiator;
    var domains = result.DOMAINS
    // var nonwhitelist = result.NONWHITELIST
    if (domains[d] === undefined) {
      domains[d] = true              /// ----- default whitelist switch -----
      // nonwhitelist.push(d + "/*")
    } 
    chrome.storage.local.set({"DOMAINS": domains});
    // chrome.storage.local.set({"NONWHITELIST": nonwhitelist});
  })
}

function checkWhitelistThenEnable() {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    checkWhitelist,
    {
      urls: ["<all_urls>"],
    },
    ["requestHeaders", "extraHeaders", "blocking"]
  );
}

/// Enable extension functionality
function enable(bool) {
  /// if bool == true, then request in whitelist, and we don't send DNS signal

    if (bool) {
      chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
      chrome.webRequest.onBeforeSendHeaders.removeListener(receivedHeaders);
    } else {
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

/// Generate DOMAINS, WHITELIST_ENABLED, NONWHITELIST keys in local storage
chrome.storage.local.get(["DOMAINS", "WHITELIST_ENABLED", "NONWHITELIST"], function (result) {
  if (result.DOMAINS == undefined) {
    chrome.storage.local.set({ "DOMAINS": {} });
  }
  if (result.WHITELIST_ENABLED == undefined) {
    chrome.storage.local.set({ "WHITELIST_ENABLED": true });
  }
  // if (result.NONWHITELIST == undefined) {
  //   chrome.storage.local.set({ "NONWHITELIST": [] });
  // }
});

chrome.storage.local.get(["ENABLED", "WHITELIST_ENABLED"], function (result) {
  if (result.ENABLED == undefined) {
    chrome.storage.local.set({ ENABLED: true });
    checkWhitelistThenEnable();
  } else if (result.ENABLED) {
    checkWhitelistThenEnable();
  } else {
    disable();
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.ENABLED != null) {
    if (request.ENABLED) {
      checkWhitelistThenEnable();
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

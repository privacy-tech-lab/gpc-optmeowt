/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
background.js
================================================================================
background.js is the main background script handling OptMeowt's 
main opt-out functionality
*/


/// Initializers
tabs = {}; /// Store all active tab id's, domain, requests, and response
activeTabID = 0;
sendSignal = false;

/// Manipulate Headers
addHeaders = (details) => {

  /* 
    This is meant to be a test for when I began writing
    a us_privacy signal parser
  */
  console.log("is this a valid signal? ", isValidUSPrivacySignal("1Nn-") )

  updateDomainsAndSignal(details);
  // addUSPrivacyAccuWeather(details);
  if (sendSignal) {
    initUSPrivacyCookie(details);
  }

  /// Now we know where to send the signal.
  if (sendSignal) {
    details.requestHeaders.push({ name: "DNS", value: "0" });
    console.log("Pushed DNS signal !");
    return { requestHeaders: details.requestHeaders };
  } 
  else {
    console.log("Preparing to send no added signal...");
    return { requestHeaders: details.requestHeaders };
  }
};

/// Manipulate received headers if need be.
receivedHeaders = (details) => {
  logData(details);
  incrementBadge(details);
};

/**
 * This specific function was written as a test function
 * that could send a cookie to overwrite the `accuweather.com`
 * us_privacy cookie signal. 
 * 
 * This can most likely be removed since a general implementation 
 * exists in us_privacy.js
 */
addUSPrivacyAccuWeather = (details) => {
  /// This could be a timing issue
  /// There could be difficulty getting the correct cookie to load 
  /// because it is already pulling the 'earliest' cookie, or 
  /// in other words the cookie we made before accuweather set theirs
  ///
  /// NEW IDEA:
  /// Try to pull all using .getAll() and then if there are multiple,
  /// delete all copies and then create your own.
  
  chrome.cookies.get({ 
      "name": 'us_privacy', // Make this not case-sensitive
      "url": details.url
      // ,"storeId": 'enterstoreidhere'
    }, 
    function (cookie) {
      // console.log("Cookie retrieved: ", details)
      if (cookie !== null) {
        console.log("COOKIE EXISTS")
        let new_cookie = cookie
        console.log("cookie domain is: ", cookie.domain)
        new_cookie.value = 'AHHH'
        // d = new_cookie.domain
        // Retrieved cookies do not store URLs but set cookies must contain them
        new_cookie.url = details.url
        // domain = null relates to 
        // https://stackoverflow.com/questions/9618217/what-does-the-dot-prefix-in-the-cookie-domain-mean
        // In other words, if domain is not passed in, the cookie becomes host-only
        // "True if the cookie is a host-only cookie (i.e. a request's host must exactly match the domain of the cookie)."
        // from https://developer.chrome.com/extensions/cookies
        // It looks like AccuWeather made the choice to make this host-specific, but we can add a check for that
        new_cookie.domain = null;
        // These two opts can exist in cookies, but ones to be set
        if (new_cookie.hostOnly !== null) {
          delete new_cookie.hostOnly
        }
        if (new_cookie.session !== null) {
          delete new_cookie.session
        }
        console.log(cookie.storeId)
        chrome.cookies.set(new_cookie, function (details) {
            console.log("Found and updated cookie value.")
            // console.log(new_cookie.storeId)
          })
      } else {
        console.log("COOKIE NULL")
      }


    }
  )
  // chrome.cookies.set(
  //   { "name": 'us_privacy', 
  //     "value": '1NYN',
  //     "url": details.url,
  //     "path": "/"
  //   }, function (details) {
  //   console.log("Updated us_privacy cookie.")
  // })
}

function updateDomainsAndSignal(details) {
  chrome.storage.local.get(["WHITELIST_ENABLED", "DOMAINS"], function (result) {
    /// Store current domain in DOMAINS
    var url = new URL(details.url);
    var parsed = psl.parse(url.hostname);
    var d = parsed.domain
    var domains = result.DOMAINS;
    console.log(d)

    if (domains[d] === undefined) {
      domains[d] = false
      chrome.storage.local.set({"DOMAINS": domains});
      console.log("Stored current domain");
    } 
    /// Set to true if whitelist is off, or if whitelist is on AND domain is whitelisted
    /// Basically, we want to know if we send the signal to a given domain
    if (result.WHITELIST_ENABLED) {
      if (domains[d] === true) {
        sendSignal = true
      } else {
        sendSignal = false
      }
    } else {
      sendSignal = true /// Always send signal to all domains
    }
    console.log(sendSignal);
  });
}

/// Logs all urls of a domain with response headers
function logData(details) {
  var url = new URL(details.url);
  var parsed = psl.parse(url.hostname);

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

/// Increment badge number
function incrementBadge() {
  let numberOfRequests = 0;
  let requests = {};
  if (tabs[activeTabID] !== undefined) {
    for (var key in tabs[activeTabID].REQUEST_DOMAINS) {
      numberOfRequests += Object.keys(tabs[activeTabID].REQUEST_DOMAINS[key].URLS).length
    }
    requests = tabs[activeTabID].REQUEST_DOMAINS;
    console.log(tabs[activeTabID])
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

/// Enable extension functionality
function enable() {
  // Headers
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
    ["responseHeaders", "extraHeaders" , "blocking"]
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
  incrementBadge();
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.id !== undefined) {
    activeTabID = tab.id;
  }
});

/// Generate DOMAINS, WHITELIST_ENABLED, NONWHITELIST keys in local storage
chrome.storage.local.get(["ENABLED", "WHITELIST_ENABLED", "DOMAINS"], function (
  result
) {
  if (result.ENABLED == undefined) {
    chrome.storage.local.set({ ENABLED: true });
  }
  if (result.WHITELIST_ENABLED == undefined) {
    chrome.storage.local.set({ WHITELIST_ENABLED: false });
  }
  if (result.DOMAINS == undefined) {
    chrome.storage.local.set({ DOMAINS: {} });
  }
});

chrome.storage.local.get(["ENABLED"], function (result) {
  if (result.ENABLED) {
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

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

/**
 * Initializers
 */
var tabs = {}; /// Store all active tab id's, domain, requests, and response
var wellknown = {} /// Store information about `well-known/gpc` files per tabs
var signalPerTab = {} /// Store information on a signal being sent for updateUI
var activeTabID = 0;
var sendSignal = false;
var optout_headers = {};
var userAgent = window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome"
var global_domains = {};


/**
 * Manipulates Headers and adds Do Not Sell signal if functionality is on
 * @param {Object} details - retrieved info passed into callback
 * @return {HttpHeaders} array of modified HTTP headers to be sent
 *                       (request headers)
 */
var addHeaders = (details) => {
  console.log("details for addHeaders with url:", details.url,  "is:", details, "sendSignal:", sendSignal);
  if (!(details.type === "TEST")) {
    console.log(`the type is -> ${details.type}, ${typeof details.type}`);
    updateDomainsAndSignal(details);

    if (sendSignal) {
      signalPerTab[details.tabId] = true
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
  /// Add current domain to list of domains to send headers to on current tab
  var url = new URL(details.url);
  var parsed = psl.parse(url.hostname);
  var d = parsed.domain;
  global_domains[d] = true;

  chrome.storage.local.get(["DOMAINLIST_ENABLED", "DOMAINS"], function (
    result
  ) {
    var domains = result.DOMAINS;
    console.log("domains is:", domains, "when global_domains is:", global_domains);

    /// Add each domain in gloabl_domains to the chrome domain list
    /// This ensures that all domains on the page are added to the domain list 
    /// if they haven't been already added
    for (const domain in global_domains) {
      if (domains[domain] === undefined) {
        domains[domain] = true;
      }
    }

    chrome.storage.local.set({ DOMAINS: domains }, function(){
      console.log("setting the storage for domain:", d);
    });

    console.log("parsed domain in updateDomain is:", d, "domains[d] is:", domains[d], "domains is:", domains);


    /// Set to true if domainlist is off, or if domainlist is on
    /// AND domain is in domainlist
    /// Basically, we want to know if we send the signal to a given domain
    if (result.DOMAINLIST_ENABLED) {
      if (domains[d] === true) {
        sendSignal = true;
        console.log("set sendSignal to TRUE for domain:", d);
      } else {
        console.log("set sendSignal to false for domain:", d);
        sendSignal = false;
      }
    } else {
      console.log("set sendSignal to TRUE for domain:", d);
      sendSignal = true; /// Always send signal to all domains
    }
    console.log("sendsignal:", sendSignal);
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
      console.log("Sending signal added for url:", details.url, "signal:", s.name, s.value);
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
  console.log("Initializing DOM signal...")
  chrome.tabs.executeScript(details.tabId, {
    file: "dom.js",
    frameId: details.frameId, // Supposed to solve multiple injections
                              // as opposed to allFrames: true
    runAt: "document_start",
  });
}

/**
 * Checks to see if DOM signal should be set, then inits DOM signal set
 * @param {Object} details  - retrieved info passed into callback
 */
function addDomSignal(details) {
  console.log("Adding dom signal...")
  updateDomainsAndSignal(details);
  if (sendSignal) {
    // From DDG, regarding `Injection into non-html pages` on issue-128
    try { 
      const contentType = document.documentElement.ownerDocument.contentType
      // don't inject into xml or json pages
      if (contentType === 'application/xml' ||
          contentType === 'application/json' ||
          contentType === 'text/xml' ||
          contentType === 'text/json' ||
          contentType === 'text/rss+xml' ||
          contentType === 'application/rss+xml'
      ) {
          return
      }
  } catch (e) {
      // if we can't find content type, go ahead with injection
  }
    initDomJS(details);
  }
}

/**
 * Allows for all background page resets necessary on a page
 * navigate. 
 * Mainly to reset the well-known boolean check for a specific tab.
 * @param {Object} details - retrieved info passed into callback
 */
function beforeNavigate(details) {
  wellknown[details.tabId] = null
  signalPerTab[details.tabId] = false
}

/**
 * Updates OptMeowt icon to reflect a Do Not Sell signal sent status
 * @param {Object} details - retrieved info passed into callback
 */
function updateUI(details) {
  console.log(`TAB ID FOR UPDATEUI ${details.tabId}`)
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
        console.log("Updated OptMeowt icon to GREEN");
      }
    );
  }
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

/**
 * Enables extension functionality and sets site listeners
 */
function enable() {
  // fetches new optout_headers on load
  fetch("json/headers.json")
    .then((response) => {
      return response.text();
    })
    .then((value) => {
      optout_headers = JSON.parse(value);
      console.log(optout_headers);
      
      // Headers
      if (userAgent === "moz") {
        chrome.webRequest.onBeforeSendHeaders.addListener(
          addHeaders,
          {
            urls: ["<all_urls>"],
          },
          ["requestHeaders", "blocking"]
        );
        chrome.storage.local.set({ ENABLED: true });

        console.log("DOM signal to navigator");
        chrome.webNavigation.onCommitted.addListener(
          addDomSignal
        )
        // .then(response => {console.log("Setting dom signal!")})
        // .catch(e => {console.log(e)})

        chrome.webNavigation.onBeforeNavigate.addListener(
          beforeNavigate
        )

        chrome.webRequest.onHeadersReceived.addListener(
          receivedHeaders,
          {
            urls: ["<all_urls>"],
          },
          ["responseHeaders", "blocking"]
        );
        // chrome.browserAction.setBadgeBackgroundColor({ color: "#666666" });
        // chrome.browserAction.setBadgeText({ text: "0" });
        chrome.storage.local.set({ ENABLED: true });
      } else {
        chrome.webRequest.onBeforeSendHeaders.addListener(
          addHeaders,
          {
            urls: ["<all_urls>"],
          },
          ["requestHeaders", "extraHeaders", "blocking"]
        );
        chrome.storage.local.set({ ENABLED: true });

        console.log("DOM signal to navigator");
        chrome.webNavigation.onCommitted.addListener(
          addDomSignal,
          {
            urls: ["<all_urls>"],
          }
        )
        // .then(response => {console.log("Setting dom signal!")})
        // .catch(e => {console.log(e)})

        chrome.webNavigation.onBeforeNavigate.addListener(
          beforeNavigate,
          {
            urls: ["<all_urls>"],
          }
        )

        chrome.webRequest.onHeadersReceived.addListener(
          receivedHeaders,
          {
            urls: ["<all_urls>"],
          },
          ["responseHeaders", "extraHeaders", "blocking"]
        );
        // chrome.browserAction.setBadgeBackgroundColor({ color: "#666666" });
        // chrome.browserAction.setBadgeText({ text: "0" });
        chrome.storage.local.set({ ENABLED: true });
      }
    })
    .catch((e) =>
      console.log(
        `Failed to intialize OptMeowt (JSON load process) (ContentScript): ${e}`
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
  chrome.webNavigation.onCommitted.removeListener(addDomSignal);
  chrome.webNavigation.onBeforeNavigate.removeListener(beforeNavigate);
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
 * Sets a cookie at the given domain for each item in the passed in
 * cookies object. Currently updates cookie url info based on domain.
 * @param {Object} cookies - Collection of info regarding each 3rd
 *                           party cookie to be set
 * Each item in `cookies` must contain a 'name', 'value', and 'domain'
 */
function setFilteredCookies(cookiesList, domainFilter) {
  // Updates time once
  var date = new Date()
  var now = date.getTime()
  var cookie_time = now/1000 + 31557600
  var path = '/'

  console.log("cookiesLIst, ", cookiesList)
  chrome.storage.local.get([ cookiesList ], function(result) { 
    if (result.THIRDPARTYCOOKIES != undefined) {
      var cookies = result.THIRDPARTYCOOKIES
    } else {
      var cookies = result.CUSTOMCOOKIES
    }
    console.log("new cookies: ", cookies)

    for (var item in cookies) {
      console.log("This is the cookies domain...", cookies[item].domain)
      for (var domain in domainFilter) {
        if (domainFilter[domain] == cookies[item].domain) {
          console.log("cookies[item].domain ", cookies[item].domain, " is in domain filter!")
          // Updates cookie url based on domain, checks for domain/subdomain spec
          let cookie_url = cookies[item].domain
          let all_domains = false
          if (cookie_url.substr(0,1) === '.') {
            cookie_url = cookie_url.substr(1)
            all_domains = true
          }
          cookie_url = `https://${cookie_url}/`
          console.log(`Current cookie url... ${cookie_url}`)
          if (cookies[item].path !== null) {
            path = cookies[item].path
          } else {
            path = '/'
          }
          // Sets cookie parameters
          let cookie_param = {
            url: cookie_url,
            name: cookies[item].name,
            value: cookies[item].value,
            expirationDate: cookie_time,
            path: path
          }
          if (all_domains) {
            cookie_param["domain"] = cookies[item].domain
          }
          // Sets cookie
          chrome.cookies.set(cookie_param, function (cookie) {
            console.log(`Updated ${cookie.name} cookie`)
          })
        }
      }
    }
  })
}


/**
 * Listener for runtime messages, in partuclar "TAB" from contentScript.js
 * or for "INIT" to start popup badge counter
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("request is:", request, "sendResponse:", sendResponse);
  if (request.ENABLED != null) {
    if (request.ENABLED) {
      enable();
      sendResponse("DONE");
    } else {
      disable();
      sendResponse("DONE");
    }
  }
  /// Once the DOM content has been loaded, global_domains is cleared
  /// This leaves a few domains that come in after DOM has been loaded
  /// but its only around 5 or so, nothing major.
  if (request.msg === "LOADED") {
    global_domains = {};
    console.log("DOM content loaded message received in background.js. global_domains is:", global_domains);
  }

  if (request.msg === "WELLKNOWNREQUEST") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      console.log("Received wellknown request")
      console.log("Received wellknown tabs callback: ", tabs[0]["id"])
      tabID = tabs[0]["id"]
      console.log(`tabID for wellknownrequest: ${tabID}`)
      let wellKnownData = wellknown[tabID]
      console.log("wellKnownData: ", wellKnownData)

      chrome.runtime.sendMessage({
        msg: "WELLKNOWNRESPONSE",
        data: wellKnownData,
      });
    });
   }

  if (request.msg === "WELLKNOWNCS") {
    console.log(`.well-known from ContentScr: ${JSON.stringify(request.data)}`);
    var tabID = sender.tab.id;
    wellknown[tabID] = request.data
    console.log(`wellknown: ${JSON.stringify(wellknown)}`)
    console.log(`wellknown[tabid]: ${JSON.stringify(wellknown[tabID])}`)
    // console.log("TAB ID: ", tabID)
    if (wellknown[tabID]["gpc"] === true){
      // wellknown[tabID] = true
      if (signalPerTab[tabID] === true) {
        chrome.browserAction.setIcon(
          {
            tabId: tabID,
            path: "assets/face-icons/optmeow-face-circle-green-128.png",
          },
          function () {
            console.log("Updated OptMeowt icon to SOLID GREEN.", );
          }
        );
      }
    }
  }
  if (request.msg === "FETCHCOOKIES") {
    setFilteredCookies("THIRDPARTYCOOKIES", request.data)
    setFilteredCookies("USERCUSTOMCOOKIES", request.data)
  }
  if (request.msg === "TAB") {
    console.log("TAB MESSAGE HAS BEEN RECEIVED")
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
      console.log("urls are:", urls)
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

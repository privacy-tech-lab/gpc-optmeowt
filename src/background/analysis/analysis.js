/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
*/


/*
analysis.js
================================================================================
analysis.js 

Overall we have one goal with this script: Run an analysis on a page.
In order to do this, we will have the following functionality:

- Check the result of a __uspapi call exposed through the window object
- Check for a usprivacy cookie
- Check for usprivacy strings in URLs
- Check for usprivacy strings in HTTP headers

We will ultimately do this in the following order: 

(1) Load a page and check for a usprivacy string
(2) Send a GPC signal to the site and reload
(3) Check for any updated usprivacy strings
(4) Compile into a resulting analysis breakdown

This can potentially extend into other privacy flags into the future. A more 
direct task nearer to the immediate future is to check how CMP (OneTrust, etc.)
sites handle opt-out cookies and how they track in accordance with sending a 
GPC signal to a site that also has/does not have usprivacy strings. 
*/


import { modes } from "../../data/modes.js";
import { defaultSettings } from "../../data/defaultSettings.js";
import { stores, storage } from "./../storage.js";
// import { debug } from "webpack";
// import psl from "psl";



/******************************************************************************/
/******************************************************************************/
/**********             # Initializers (cached values)               **********/
/******************************************************************************/
/******************************************************************************/


var analysis = {};
var urlFlags;
var hasReloaded = true;
// var domainlist = {};    // Caches & mirrors domainlist in storage
// var mode = defaultSettings["MODE"]; // Caches the extension mode
// var isDomainlisted = defaultSettings["IS_DOMAINLISTED"];
// var tabs = {};          // Caches all tab infomration, i.e. requests, etc. 
// var wellknown = {};     // Caches wellknown info to be sent to popup
// var signalPerTab = {};  // Caches if a signal is sent to render the popup icon
// var activeTabID = 0;    // Caches current active tab id
// var sendSignal = true;  // Caches if the signal can be sent to the curr domain


/*

Analysis object prototype structure

var analysis = {
  "wired.com": {  // DOMAIN LEVEL
    0: {
      "FIRST": {  // All of the info here will be scraped if privacy flag found
        "COOKIES": {
          "usprivacy": {
            domain: "www.wired.com",
            expirationDate: 1663019064,
            firstPartyDomain: "",
            hostOnly: true,
            httpOnly: false,
            name: "usprivacy",
            path: "/",
            sameSite: "lax",
            secure: false,
            session: false,
            storeId: "firefox-default",
            value: "1---"
          }
        },
        "DO_NOT_SELL_LINK_EXISTS": false,
        "HEADERS": {},
        "URLS": {},
        "USPAPI": {
          "uspString": {
            uspString: "1---",
            version: 1
          }
        },
        "USPAPI_LOCATOR": {}, // Not sure if we need this here
        "THIRD_PARTIES": {
          // 'RECURSIVE' 2nd DOMAIN LEVEL
          "https://eus.rubiconproject.com/usync.html?us_privacy=1---": {
            0: {
              "FIRST": {
                "COOKIES": {},
                "HEADERS": {},
                "URLS": {
                  "us_privacy": "1---"
                },
                "USPAPI": {},
                "USPAPI_LOCATOR": {}
              }, 
              "SECOND": {
                ...
              }
            }
          }
        }
      },
      "SECOND": {
        ...
      }
    },
    1: {
      ...
    }
  }
}

{
  "accuweather.com": 
    "FIRST_USP": "1YNN",
    "FIRST_USP_BOOL": false,
    "GPC_SENT": true,
    "SECOND_USP": "1YYN",
    "SECOND_USP_BOOL": "true",
    "RESULT": ,
    "CONFLICTS": 
}

*/


/******************************************************************************/
/******************************************************************************/
/**********                  # Stanley's functions                   **********/
/******************************************************************************/
/******************************************************************************/


function loadFlags() {
  var urlFlags = [];
  //Load the privacy flags from the static json file
  fetch(chrome.extension.getURL('/data/privacy_flags.json'))
    .then((resp) => resp.json())
    .then(function (jsonData) {
      console.log("flagdata" + JSON.stringify(jsonData));
      flagObject = jsonData;
      console.log("FLAGONE" + jsonData.flags[0].name);
      flagObject.flags.forEach(flag => {
        urlFlags.push(flag.name);
      });
      console.log("URLFLAGS" + urlFlags);
    });
    return urlFlags;
}

// 1: details 2: did we privatize this request?
// Firefox implementation for fingerprinting classification flags
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders
function processTrackingRequest (details, privatized){
  var urlFlags = loadFlags();

  debug.log("Fingerprinting request recieved")
  if (details.urlClassification != null) {
    // await storage.set(stores.analysis,details.documentURL,true);
    storage.set(stores.analysis,details.documentURL,true); 
    debug.log("Fingerprinting request recieved")
    debug.log(details.urlClassification)

    var settingsdict = parseURLForSignal(details.documentURL)
    //parse header
    for (let header of e.requestHeaders) {
      if (header.name.toLowerCase() in urlFlags) {
        // flag was in header
      }
    }

  }
  return details
}

function parseURLForSignal(url) {
  var flagSettingsDict = [];

  //Unescape the URL strip off everything until the parameter bit 
  // (anything after the question mark)
  url = unescape(url);
  url = url.substring(url.indexOf("\?"));
  if (url.length == 0) {
    return;
  }

  var params = new URLSearchParams(url);

  urlFlags.forEach(flag => {
    if (params.has(flag)) {
      flagSettingsDict[flag] = params.get(flag);
    }
  });

  return flagSettingsDict;
}



/******************************************************************************/
/******************************************************************************/
/**********          # Functions & Listeners                         **********/
/******************************************************************************/
/******************************************************************************/


let newIncognitoTab = chrome.windows.create({ "url": null, "incognito": true });

let usprivacyRegex = /us-?_?privacy/g;

// Listener parameters for webRequest & webNavigation
const MOZ_REQUEST_SPEC = ["requestHeaders", "blocking"]
const MOZ_RESPONSE_SPEC = ["responseHeaders", "blocking"]
const FILTER = { urls: ["<all_urls>"] }


// webRequest and webNaviation listeners - for grabbing HTTP headers
// chrome.webRequest.onBeforeSendHeaders.addListener(
// 	onBeforeSendHeaders,
// 	FILTER,
// 	MOZ_REQUEST_SPEC
// )
// chrome.webRequest.onHeadersReceived.addListener(
// 	onHeadersReceived,
// 	FILTER,
// 	MOZ_RESPONSE_SPEC
// )
chrome.webNavigation.onBeforeNavigate.addListener((result) => {
  console.log("Value of hasReloaded before change: ", hasReloaded)
  hasReloaded = !hasReloaded;
})

function runAnalysis() {
  hasReloaded = false;
  console.log("Immediately initializing page reload... standby from onCommited... ")
  console.log("Finished loading page. Curr hasReloaded = ", hasReloaded);
  if (!hasReloaded) {
    chrome.tabs.reload();
    hasReloaded = true;
  }
}
// chrome.webNavigation.onCommitted.addListener((result) => {
//   console.log("Immediately initializing page reload... standby from onCommited... ")
//   console.log("Finished loading page. Curr hasReloaded = ", hasReloaded);
//   if (!hasReloaded) {
//     chrome.tabs.reload();
//   }
// })

// window.addEventListener('load', (event) => {
//   console.log("Finished loading page. Curr hasReloaded = ", hasReloaded);
//   if (!hasReloaded) {
//     chrome.tabs.reload();
//   }
// })

/**
 * 
 * @param {Object} data 
 * Parameters - type: STRING, data: ANY
 */
function logData(data) {

}

// Cookie listener - grabs ALL cookies as they are changed
let listenerForUSPCookies = chrome.cookies.onChanged.addListener(
  (changeInfo) => {
    if (!changeInfo.removed) {
      let cookie = changeInfo.cookie;
      let domain = cookie.domain;

      if (usprivacyRegex.test(cookie.name)) {
        if (!analysis[domain]) analysis[domain] = {};
        let length = Object.keys(analysis[cookie.domain]).length;

        analysis[cookie.domain][length+1] = cookie;
      }
    }
    console.log(analysis);
})

// Message passing listener - for collecting USPAPI call data from window
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.msg === "USPAPI_TO_BACKGROUND") {
    console.log("Data from USPAPI returned to background", message.data);
    console.log("Message object: ", message);
    logData(domain, "COOKIES", message.data);
  }
  if (message.msg === "RUN_ANALYSIS") {
    runAnalysis();
  }
});

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function (message) {
    if (message.msg === "RUN_ANALYSIS_FROM_BACKGROUND") {
      runAnalysis();
      // chrome.runtime.sendMessage({
      //   msg: "RUN_ANALYSIS",
      //   data: null,
      // });
    }
  })
})


/******************************************************************************/
/******************************************************************************/
/**********           # Exportable init / halt functions             **********/
/******************************************************************************/
/******************************************************************************/


function preinit() {
  // urlFlags = loadFlags()
}

export function init() {
	newIncognitoTab;
  listenerForUSPCookies;
}

function postinit() {}
  
export function halt() {
	// disableListeners(listenerCallbacks);
}
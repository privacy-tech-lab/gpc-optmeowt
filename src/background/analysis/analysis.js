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
import psl from "psl";
import { onBeforeSendHeaders } from "../protection/events.js";
import { IS_BROWSER } from "../../theme/darkmode.js";
import { headers } from "../../data/headers"
import { popperOffsets } from "@popperjs/core";



/******************************************************************************/
/******************************************************************************/
/**********             # Initializers (cached values)               **********/
/******************************************************************************/
/******************************************************************************/


var analysis = {};
var urlFlags;
// var hasReloaded = false;

// var domainlist = {};    // Caches & mirrors domainlist in storage
// var mode = defaultSettings["MODE"]; // Caches the extension mode
// var isDomainlisted = defaultSettings["IS_DOMAINLISTED"];
// var tabs = {};          // Caches all tab infomration, i.e. requests, etc. 
// var wellknown = {};     // Caches wellknown info to be sent to popup
// var signalPerTab = {};  // Caches if a signal is sent to render the popup icon
// var activeTabID = 0;    // Caches current active tab id
// var sendSignal = true;  // Caches if the signal can be sent to the curr domain


var sendingGPC = false;
var changingSitesOnAnalysis = false;
var changingSitesOnUserRequest = false;  // used to create new analysis section
// use this to bump all teh variables up one


/*

Analysis object prototype structure

var analysis = {
  "wired.com": {  // DOMAIN LEVEL
    0: {
      "BEFORE_GPC": {  // All of the info here will be scraped if privacy flag found
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
              "BEFORE_GPC": {
                "COOKIES": {},
                "HEADERS": {},
                "URLS": {
                  "us_privacy": "1---"
                },
                "USPAPI": {},
                "USPAPI_LOCATOR": {}
              }, 
              "AFTER_GPC": {
                ...
              }
            }
          }
        }
      },
      "AFTER_GPC": {
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


var analysis = {
  "wired.com": [  // DOMAIN LEVEL
    {
      "TIMESTAMP": {},
      "BEFORE_GPC": {  // All of the info here will be scraped if privacy flag found
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
          "https://eus.rubiconproject.com/usync.html?us_privacy=1---": 
          [
            {
              "BEFORE_GPC": {
                "COOKIES": {},
                "HEADERS": {},
                "URLS": { "us_privacy": "1---" },
                "USPAPI": {},
                "USPAPI_LOCATOR": {}
              }, 
              "AFTER_GPC": { ... }
            }
          ]
        }
      },
      "AFTER_GPC": { ... }
    }
  ]
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


// Listener parameters for webRequest & webNavigation
const MOZ_REQUEST_SPEC = ["requestHeaders", "blocking"];
const MOZ_RESPONSE_SPEC = ["responseHeaders", "blocking"];
const FILTER = { urls: ["<all_urls>"] };

let newIncognitoTab = chrome.windows.create({ "url": null, "incognito": true });
let usprivacyRegex = /us-?_?privacy/g;

function addHeaders(details) {
  for (let signal in headers) {
    let s = headers[signal]
    details.requestHeaders.push({ name: s.name, value: s.value })
  }
  return { requestHeaders: details.requestHeaders }
}


var addGPCHeaders = function() {
  sendingGPC = true;
  chrome.webRequest.onBeforeSendHeaders.addListener(
    // onBeforeSendHeaders,
    // (() => {console.log("RUNNING addGPCHeaders();")}),
    addHeaders,
    FILTER,
    MOZ_REQUEST_SPEC
);}
var removeGPCHeaders = function() {
  sendingGPC = false;
  chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
}

/**
 * Initializes the analysis with a refresh after being triggered
 */
function runAnalysis() {
  sendingGPC = true;
  changingSitesOnAnalysis = true;
  addGPCHeaders();
  
  console.log("Reloading site, sendingGPC =", sendingGPC);
  chrome.tabs.reload();
}
function disableAnalysis() {
  console.log("DISABLING ANALYSIS, REMOVING GPC HEADERS")
  sendingGPC = false;
  changingSitesOnAnalysis = false;
  removeGPCHeaders();
}


chrome.webNavigation.onCommitted.addListener((details) => {
  // https://developer.chrome.com/docs/extensions/reference/history/#transition_types
  let validTransition = isValidTransition(details.transitionType);
  console.log("transitionType: ", details.transitionType);

  // changingSitesOnAnalysis, changingSitesOnUserRequest, sendingGPC

  if (validTransition) {

    if (changingSitesOnAnalysis) {
      // add SENDINGS GPC TO FILE
      // Turn off changing sites on analysis 
      changingSitesOnAnalysis = false;
    } else {  // Must be on user request
      disableAnalysis();
      changingSitesOnUserRequest = true;
    }
    // if (changingSitesOnUserRequest) {
    //   // changingSitesOnUserRequest = false;
    //   disableAnalysis();
    // }

    // if (!sendingGPC) {
    //   changingSitesOnUserRequest = true;
    //   disableAnalysis();
    // } else {
    //   disableAnalysis();
    // }

  }
})

// var doNotSellRegex = /(Do.Not|Don.t).Sell.(My)?/gmi


// function webRequestFiltering(details) {
//   let filter = browser.webRequest.filterResponseData(details.requestId);
//   let decoder = new TextDecoder("utf-8");
//   let encoder = new TextEncoder(); 

//   console.log("Here is teh origin: ", details.url)
//   filter.ondata = event => {
//     console.log("Here is the webRequestFiltering", event);
//     let str = decoder.decode(event.data, {stream: true});
//     console.log("Here is our REGEX TEST: ", doNotSellRegex.test(str))
//     // console.log("Here is the parsed webRequestFiltering", str);
//     filter.write(encoder.encode(str));
//     filter.disconnect();
//   }
// }


// chrome.webRequest.onBeforeSendHeaders.addListener(
//   webRequestFiltering,
//   FILTER,
//   MOZ_REQUEST_SPEC
// )




/**
 * https://developer.chrome.com/docs/extensions/reference/history/#transition_types 
 * @param {transitionType} transition 
 * @returns bool
 */
 function isValidTransition(transition) {
  return (transition === "link"
  || transition === "typed"
  || transition === "generated"
  || transition === "reload"
  || transition === "keyword"
  || transition === "keyword_generated" // Potentially unneeded
  );
}

/**
 * Returns url domain: String
 * @param {String} url 
 */
 function parseURL(url) {
  let urlObj = new URL(url);
  return (psl.parse(urlObj.hostname)).domain;
}


var analysisDataSkeletonThirdParties = () => {
  return {
    "TIMESTAMP": null,
    "COOKIES": [],
    "HEADERS": {},
    "URLS": {},
    "USPAPI": [],
    "USPAPI_LOCATOR": {}
  }
}
var analysisDataSkeletonFirstParties = () => { 
  return {
    "BEFORE_GPC": {
      "TIMESTAMP": null,
      "COOKIES": [],
      "DO_NOT_SELL_LINK_EXISTS": null,
      "HEADERS": {},
      "URLS": {},
      "USPAPI": [],
      "USPAPI_LOCATOR": {},
      "THIRD_PARTIES": {}
    },
    "AFTER_GPC": {
      "TIMESTAMP": null,
      "COOKIES": [],
      "DO_NOT_SELL_LINK_EXISTS": null,
      "HEADERS": {},
      "URLS": {},
      "USPAPI": [],
      "USPAPI_LOCATOR": {},
      "THIRD_PARTIES": {}
    },
    "SENT_GPC": null
  }
}

/**
 * 
 * @param {Object} data 
 * Parameters - type: STRING, data: ANY
 */
function logData(domain, command, data) {
  let gpcStatusKey = sendingGPC ? "AFTER_GPC" : "BEFORE_GPC";
  // let gpcStatusKey = changingSitesOnUserRequest ? "BEFORE_GPC" : "AFTER_GPC";

  if (!analysis[domain]) {
    console.log("Adding analysis[domain] = [];")
    analysis[domain] = [];
  }

  let callIndex = analysis[domain].length;
  console.log("call index: ", callIndex)

  // FIX TEH USE CASE HERE FOR ARRAYS

  if (changingSitesOnUserRequest) {
    analysis[domain][callIndex] = analysisDataSkeletonFirstParties();
    changingSitesOnUserRequest = false;
  } else {
    callIndex -= 1;
    console.log("Saving to minus one callindex", callIndex)
    console.log("(4) analysis: ", analysis);
  }

  if (!analysis[domain][callIndex][gpcStatusKey]["TIMESTAMP"]) {
    let ms = Date.now();
    analysis[domain][callIndex][gpcStatusKey]["TIMESTAMP"] = ms; 
  }

  if (sendingGPC) {
    analysis[domain][callIndex]["SENT_GPC"] = true;
  }

  // Let's assume that data does have a name property as a cookie should
  if (command === "COOKIES") {
    console.log("Got to COMMAND === COOKIES");
    // if (changingSitesOnUserRequest) {   // could this also be sendingGPC?
      analysis[domain][callIndex][gpcStatusKey]["COOKIES"].push(data);
    // } else {}

    // Make a new enumerated section under the particular domain
    // otherwise use the last one
  }
  if (command === "USPAPI") {
    console.log("Got to COMMAND === USPAPI");
    analysis[domain][callIndex][gpcStatusKey]["USPAPI"].push(data);
  }
  console.log("Finished logging: ", analysis);
}



// Cookie listener - grabs ALL cookies as they are changed
let listenerForUSPCookies = chrome.cookies.onChanged.addListener(
  (changeInfo) => {
    if (!changeInfo.removed) {
      let cookie = changeInfo.cookie;
      let urlObj = psl.parse(cookie.domain);

      if (usprivacyRegex.test(cookie.name)) {
        console.log("Init logData() from listenerForUSPCookies")
        console.log("logData domain: ", urlObj.domain)
        logData(urlObj.domain, "COOKIES", cookie);
        // if (!analysis[domain]) analysis[domain] = {};
        // let length = Object.keys(analysis[cookie.domain]).length;

        // analysis[cookie.domain][length+1] = cookie;
      }
    }
    // console.log(analysis);
})



// hi my name is iyanna hehehe hi my name is iyanna :) name? 


// Message passing listener - for collecting USPAPI call data from window
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.msg === "USPAPI_TO_BACKGROUND") {
    let url = new URL(message.location);
    // let parsed = psl.parse(url);
    // let domain = parsed.domain;
    let domain = parseURL(url);
    console.log("Data from USPAPI returned to background", message.data);
    console.log("Message object: ", message);
    console.log("Init logData() from runtime.onMessage")
    console.log("logData domain: ", domain)
    logData(domain, "USPAPI", message.data);
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
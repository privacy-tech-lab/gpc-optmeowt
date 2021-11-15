/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
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
import { cookiesPhrasing, doNotSellPhrasing } from "../../data/regex"
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
var analysis_userend = {};
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


/**
 * 
 * @returns 
 */
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
/**
 * 
 * @param {*} details 
 * @param {*} privatized 
 * @returns 
 */
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

/**
 * 
 * @param {*} url 
 * @returns 
 */
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
/**********                       # Functions                        **********/
/******************************************************************************/
/******************************************************************************/


// Listener parameters for webRequest & webNavigation
const MOZ_REQUEST_SPEC = ["requestHeaders", "blocking"];
const MOZ_RESPONSE_SPEC = ["responseHeaders", "blocking"];
const FILTER = { urls: ["<all_urls>"] };

//let newIncognitoTab = chrome.windows.create({ "url": null, "incognito": true });


function addHeaders(details) {
  webRequestResponseFiltering(details);
  for (let signal in headers) {
    let s = headers[signal]
    details.requestHeaders.push({ name: s.name, value: s.value })
  }
  return { requestHeaders: details.requestHeaders }
}

/**
 * Initializes the analysis with a refresh after being triggered
 * 
 * -- NOTE: This below is a proposed idea, not actually implemented --
 * Essentially we want to make sure GPC headers and dom properties 
 * are added here. Handle that HERE
 * 
 * (1) Add GPC headers
 * (2) Attach DOM property to page after reload
 */
function runAnalysis() {
  // console.log("Reloading site, sendingGPC =", sendingGPC);
  sendingGPC = true;
  changingSitesOnAnalysis = true;
  addGPCHeaders();
  chrome.tabs.reload();

  // // This is a proposed better implementation that consolidates all the 
  // // GPC signals to be sent into one function
  // changingSitesOnUserRequest = false;
  // let reloading = browser.tabs.reload();
  // function onReloaded(details) {
  //   function addDomListener(details) {
  //     addDomSignal(details);
  //     chrome.webNavigation.onCommitted.removeListener(addDomListener)
  //   }
  //   chrome.webNavigation.onCommitted.addListener(addDomListener)
  // }
  // function onError(e) { console.error(e) }
  // reloading.then(onReloaded, onError)
}

function disableAnalysis() {
  // console.log("DISABLING ANALYSIS, REMOVING GPC HEADERS")
  sendingGPC = false;
  changingSitesOnAnalysis = false;
  removeGPCHeaders();
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

/**
 * Processes caught responses via webRequest filtering as they come in
 * Parses all incoming responses for Do Not Sell links
 * @param {Object, String}
 */
function handleResponseChunk(details, str) {
  if (doNotSellPhrasing.test(str)) {
    let match = str.match(doNotSellPhrasing)
    // console.log("found it in webRequestResponseFiltering", str);
    let url = new URL(details.url);
    // console.log("found it URL in webRequestResponseFiltering: ", url);
    // let url = new URL(message.location);
    let domain = parseURL(url);
    // console.log("domain inside webRequestResponseFiltering: ", domain)
    logData(domain, "DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING", match);
  }
}

/**
 * Checks for do not sell links as responses come in
 * @param {*} details 
 */
function webRequestResponseFiltering(details) {
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder("utf-8");
  let encoder = new TextEncoder();
  
  let data = [];
  filter.ondata = event => {
    filter.write(event.data); // Write immediately, we don't want to change the response
    const decodedChunk = decoder.decode(event.data, { stream: true });
    data.push(decodedChunk);
  }

  filter.onstop = event => {
    filter.close();
    const str = data.toString();
    handleResponseChunk(details, str);
  }

  filter.onerror = event => {
    console.error(filter.error);
    request.error = filter.error;
  }
}

// Tentative idea:
// Make every item in here only one thing so you can easily
// convert to a spreadsheet for saving as a .csv file
var analysisUserendSkeleton = () => {
  return {
    "TIMESTAMP": null,
    "DO_NOT_SELL_LINK_EXISTS": null,
    "DO_NOT_SELL_LINK_EXISTS_TIMESTAMP": null,
    "SENT_GPC": false,
    "SENT_GPC_TIMESTAMP": null,
    "USPAPI_BEFORE_GPC": [],
    "USPAPI_BEFORE_GPC_TIMESTAMP": null,
    "USPAPI_AFTER_GPC": [],
    "USPAPI_AFTER_GPC_TIMESTAMP": null,
    "USPAPI_OPTED_OUT": undefined,
    "USPAPI_OPTED_OUT_TIMESTAMP": null
  }
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
      "DO_NOT_SELL_LINK": [],
      "DO_NOT_SELL_LINK_EXISTS": null,
      "DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING": [],
      "HEADERS": {},
      "URLS": {},
      "USPAPI": [],
      "USPAPI_LOCATOR": {},
      "THIRD_PARTIES": {}
    },
    "AFTER_GPC": {
      "TIMESTAMP": null,
      "COOKIES": [],
      "DO_NOT_SELL_LINK": [],
      "DO_NOT_SELL_LINK_EXISTS": null,
      "DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING": [],
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
async function logData(domain, command, data) {
  let gpcStatusKey = sendingGPC ? "AFTER_GPC" : "BEFORE_GPC";
  // let gpcStatusKey = changingSitesOnUserRequest ? "BEFORE_GPC" : "AFTER_GPC";
  console.log("changingSitesOnUserRequest", changingSitesOnUserRequest)

  console.log("domain from logData: ", domain);

  if (!analysis[domain]) {
    console.log(`Adding analysis[${domain}] = [];`)
    analysis[domain] = [];
    analysis_userend[domain] = [];
  }
  let callIndex = analysis[domain].length;

  console.log("analysis after adding domain: ", analysis)
  // // Check to see if you are running analysis, but no logs inside BEFORE_GPC
  // if (analysis[domain][callIndex]["BEFORE_GPC"]) {  // if initialized
  //   if (!analysis[domain][callIndex]["BEFORE_GPC"]["TIMESTAMP"]) {}
  // }
  console.log("call index: ", callIndex)

  // FIX TEH USE CASE HERE FOR ARRAYS

  console.log("changingSitesOnUserRequest", changingSitesOnUserRequest)
  if (changingSitesOnUserRequest) {
    console.log("RAN FIRST PART")
    analysis[domain][callIndex] = analysisDataSkeletonFirstParties();
    analysis_userend[domain] = analysisUserendSkeleton();
    changingSitesOnUserRequest = false;
  } else {
    console.log("RAN SECOND PART")
    callIndex -= 1;
    // console.log("Saving to minus one callindex", callIndex)
    // console.log("(4) analysis: ", analysis);
  }
  console.log("changingSitesOnUserRequest", changingSitesOnUserRequest)

  console.log("analysis after maybe addign callindex: ", analysis)

  let ms = Date.now();

  if (!analysis[domain][callIndex][gpcStatusKey]["TIMESTAMP"]) {
    analysis[domain][callIndex][gpcStatusKey]["TIMESTAMP"] = ms; 
    analysis_userend[domain]["TIMESTAMP"] = ms;
  }

  if (sendingGPC) {
    analysis[domain][callIndex]["SENT_GPC"] = true;
    analysis_userend[domain]["SENT_GPC"] = true;
    analysis_userend[domain]["SENT_GPC_TIMESTAMP"] = ms;
  }

  // Let's assume that data does have a name property as a cookie should
  if (command === "COOKIES") {
    analysis[domain][callIndex][gpcStatusKey]["COOKIES"].push(data);
    // console.log("Got to COMMAND === COOKIES");

    // Make a new enumerated section under the particular domain
    // otherwise use the last one
  }
  if (command === "USPAPI") {
    analysis[domain][callIndex][gpcStatusKey]["USPAPI"].push(data);
    
    // Detailed case for summary object
    if (gpcStatusKey == "BEFORE_GPC") {
      analysis_userend[domain]["USPAPI_BEFORE_GPC"].push(data);
      analysis_userend[domain]["USPAPI_BEFORE_GPC_TIMESTAMP"] = ms;
    }
    if (gpcStatusKey == "AFTER_GPC") {
      analysis_userend[domain]["USPAPI_AFTER_GPC"].push(data);
      analysis_userend[domain]["USPAPI_AFTER_GPC_TIMESTAMP"] = ms;
      try {
        let usprivacyString = data.value || data.uspString;
        console.log("data: ", data);
        console.log("the usprivacyString breakdown", data.uspString, data.value)
        console.log("usprivacyString: ", usprivacyString);
        if (usprivacyString[2] === "Y" || usprivacyString[2] === "y") {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = true;
        } else if (usprivacyString[2] === "-") {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = "N/A - Outside CA";
        } else if (usprivacyString[2] === "N" || usprivacyString[2] == "n") {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = false;
        } else {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = null;
        }
      } catch (e) {
        console.error("Parsing USPAPI for analysis_userend failed.", e);
        analysis_userend[domain]["USPAPI_OPTED_OUT"] = "PARSE_FAILED"; 
      }
      analysis_userend[domain]["USPAPI_OPTED_OUT_TIMESTAMP"] = ms;
    }

  }
  if (command === "DO_NOT_SELL_LINK") {
    // console.log("Got to COMMAND === USPAPI");
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK"].push(data);
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK_EXISTS"] = true;
    analysis_userend[domain]["DO_NOT_SELL_LINK_EXISTS"] = true;
    analysis_userend[domain]["DO_NOT_SELL_LINK_EXISTS_TIMESTAMP"] = ms;
  }
  if (command === "DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING") {
    // console.log("Got to COMMAND === USPAPI");
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING"].push(data);
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK_EXISTS"] = true;
    analysis_userend[domain]["DO_NOT_SELL_LINK_EXISTS"] = true;
    analysis_userend[domain]["DO_NOT_SELL_LINK_EXISTS_TIMESTAMP"] = ms;

  }
  console.log("Updated analysis logs: ", analysis);
  console.log("Updated analysis_userend logs: ", analysis_userend);

  console.log("Attempting to update stores...");
  storage.set(stores.analysis, analysis_userend[domain], domain);
  const a = await storage.getStore(stores.analysis);
  console.log(a);
}



/******************************************************************************/
/******************************************************************************/
/**********                       # Listeners                        **********/
/******************************************************************************/
/******************************************************************************/


var addGPCHeaders = function() {
  sendingGPC = true;
  chrome.webRequest.onBeforeSendHeaders.addListener(
    addHeaders,
    FILTER,
    MOZ_REQUEST_SPEC
  );
}

var removeGPCHeaders = function() {
  sendingGPC = false;
  chrome.webRequest.onBeforeSendHeaders.removeListener(addHeaders);
}

// Cookie listener - grabs ALL cookies as they are changed
let listenerForUSPCookies = chrome.cookies.onChanged.addListener(
  (changeInfo) => {
    if (!changeInfo.removed) {
      let cookie = changeInfo.cookie;
      let domain = cookie.domain;
      domain = domain[0] == '.' ? domain.substring(1) : domain;
      let urlObj = psl.parse(domain);

      if (cookiesPhrasing.test(cookie.name)) {
        // console.log("Init logData() from listenerForUSPCookies")
        // console.log("logData domain: ", urlObj.domain)
        logData(urlObj.domain, "COOKIES", cookie);
      }
    }
    // console.log(analysis);
})

chrome.webNavigation.onCommitted.addListener((details) => {
  console.log("onCommitted Triggered!!")
// https://developer.chrome.com/docs/extensions/reference/history/#transition_types
  let validTransition = isValidTransition(details.transitionType);
  console.log("transitionType: ", details.transitionType);

  // changingSitesOnAnalysis, changingSitesOnUserRequest, sendingGPC
  console.log("changingSitesOnUserRequest", changingSitesOnUserRequest)
  // console.log("changingSitesOnAnalysis", changingSitesOnAnalysis)
  if (validTransition) {
    if (changingSitesOnAnalysis) {
      // add SENDING GPC TO FILE
      // Turn off changing sites on analysis 
      addDomSignal(details);
      changingSitesOnAnalysis = false;
    } else {  // Must be on user request
      disableAnalysis();
      changingSitesOnUserRequest = true;
      console.log("cancelling analysis!")
    }
  }
})

// Message passing listener - for collecting USPAPI call data from window
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.msg === "USPAPI_TO_BACKGROUND") {
    let url = new URL(message.location);
    let domain = parseURL(url);
    // console.log("Data from USPAPI returned to background", message.data);
    // console.log("Message object: ", message);
    // console.log("Init logData() from runtime.onMessage")
    // console.log("logData domain: ", domain)
    logData(domain, "USPAPI", message.data);
  }
  if (message.msg === "DNS_FINDER_TO_BACKGROUND") {
    let url = new URL(message.location);
    let domain = parseURL(url);
    logData(domain, "DO_NOT_SELL_LINK", message.data)
  }
  if (message.msg === "RUN_ANALYSIS") {
    runAnalysis();
  }
  if (message.msg === "POPUP") {
    chrome.runtime.sendMessage({
      msg: "POPUP_DATA",
      data: { analysis, analysis_userend }
    }); 
  }
  if (message.msg === "CSV_DATA_REQUEST") {
    chrome.runtime.sendMessage({
      msg: "CSV_DATA_RESPONSE",
      data: analysis_userend
    });
  }
});

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function (message) {
    if (message.msg === "RUN_ANALYSIS_FROM_BACKGROUND") {
      runAnalysis();
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
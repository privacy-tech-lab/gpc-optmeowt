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


// import { debug } from "webpack";
import { modes } from "../../data/modes.js";
import { defaultSettings } from "../../data/defaultSettings.js";
import { stores, storage } from "./../storage.js";
import { cookiesPhrasing, uspPhrasing, doNotSellPhrasing } from "../../data/regex"
import psl from "psl";
import { IS_BROWSER } from "../../theme/darkmode.js";
import { headers } from "../../data/headers"



/******************************************************************************/
/******************************************************************************/
/**********             # Initializers (cached values)               **********/
/******************************************************************************/
/******************************************************************************/


var analysis = {};
var analysis_userend = {};
var urlsWithUSPString = [];

var sendingGPC = false;
var changingSitesOnAnalysis = false;
var changingSitesOnUserRequest = false;  // used to create new analysis section



/******************************************************************************/
/******************************************************************************/
/**********                       # Functions                        **********/
/******************************************************************************/
/******************************************************************************/


// Listener parameters for webRequest & webNavigation
const MOZ_REQUEST_SPEC = ["requestHeaders", "blocking"];
const MOZ_RESPONSE_SPEC = ["responseHeaders", "blocking"];
const FILTER = { urls: ["<all_urls>"] };

async function checkForUSPString(url) {
  if (uspPhrasing.test(url)) {
    urlsWithUSPString.push(url)
    // console.log("Matched URL with US_PRIVACY substring: ", url);
    // console.log("URLs with US_PRIVACY string: ", urlsWithUSPString);
  }
}

/**
 * Though the name says just GPC headers are added here, we also:
 * (1) Check the current stopped URL for a us_privacy string
 * (2) Pass the incoming stream to a filter to look for a Do Not Sell Link
 * (3) Attatch the GPC headers
 * NOTE: We attach the DOM property in another listener upon finishing reloading
 * @param {Object} details 
 * @returns Object
 */
function addGPCHeadersCallback(details) {
  checkForUSPString(details.url); // Dump all URLs that contain a us_privacy string
  webRequestResponseFiltering(details);        // Filter for Do Not Sell link

  for (let signal in headers) {                // add GPC headers
    let s = headers[signal]
    details.requestHeaders.push({ name: s.name, value: s.value })
  }
  return { requestHeaders: details.requestHeaders }
}

var addGPCHeaders = function() {
  sendingGPC = true;
  chrome.webRequest.onBeforeSendHeaders.addListener(
    addGPCHeadersCallback,
    FILTER,
    MOZ_REQUEST_SPEC
  );
}

var removeGPCSignals = function() {
  sendingGPC = false;
  chrome.webRequest.onBeforeSendHeaders.removeListener(addGPCHeadersCallback);
}

/**
 * Initializes the analysis with a refresh after being triggered
 * 
 * (1) Add GPC headers
 * (2) Attach DOM property to page after reload
 */
function runAnalysis() {
  sendingGPC = true;
  changingSitesOnAnalysis = true;
  addGPCHeaders();
  chrome.tabs.reload();
}

function disableAnalysis() {
  sendingGPC = false;
  changingSitesOnAnalysis = false;
  removeGPCSignals();
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
    let url = new URL(details.url);
    // let url = new URL(message.location);
    let domain = parseURL(url);
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
    // request.error = filter.error;
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
function logData(domain, command, data) {
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
  // console.log(a);
}



/******************************************************************************/
/******************************************************************************/
/**********                       # Listeners                        **********/
/******************************************************************************/
/******************************************************************************/


/**
 * Cookie listener - grabs ALL cookies as they are changed
 */
function cookiesOnChangedCallback() {
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
  }
}

/**
 * Runs anytime the webNavigation.onCommitted listers triggers,
 * especially when making transitions from running analysis and being passive.
 * Also important in making sure all sites without anything noteworthy are logged
 * @param {Object} details 
 */
function onCommittedCallback(details) {
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
      let url = new URL(details.url);
      let domain = parseURL(url);
      logData(domain, null, null); // Makes sure to log the 1st party domain to analysis_userend
      console.log("cancelling analysis!");
    }
  }
}

/**
 * Message passing listener - for collecting USPAPI call data from the window
 */
 function onMessageHandler(message, sender, sendResponse) {
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
  if (message.msg === "POPUP_ANALYSIS") {
    chrome.runtime.sendMessage({
      msg: "POPUP_ANALYSIS_DATA",
      data: { analysis, analysis_userend }
    }); 
  }
  if (message.msg === "CSV_DATA_REQUEST") {
    chrome.runtime.sendMessage({
      msg: "CSV_DATA_RESPONSE",
      data: {
        csvData: analysis_userend,
        titles: analysisUserendSkeleton()
      }
    });
  }
  if (message.msg === "CSV_DATA_REQUEST_FROM_SETTINGS") {
    chrome.runtime.sendMessage({
      msg: "CSV_DATA_RESPONSE_TO_SETTINGS",
      data: {
        csvData: analysis_userend,
        titles: analysisUserendSkeleton()
      }
    });
  }
}

/**
 * Handles actually running the analysis when it is fired
 */
 function onConnectHandler(port) {
  port.onMessage.addListener(function (message) {
    if (message.msg === "RUN_ANALYSIS_FROM_BACKGROUND") {
      runAnalysis();
    }
  })
}

/**
 * Enables all the important listeners in one place
 */
function enableListeners() {
  chrome.cookies.onChanged.addListener(cookiesOnChangedCallback);
  chrome.webNavigation.onCommitted.addListener(onCommittedCallback);
  chrome.runtime.onMessage.addListener(onMessageHandler);
  chrome.runtime.onConnect.addListener(onConnectHandler);
}

function disableListeners() {
  chrome.cookies.onChanged.removeListener(cookiesOnChangedCallback);
  chrome.webNavigation.onCommitted.removeListener(onCommittedCallback);
  chrome.runtime.onMessage.removeListener(onMessageHandler);
  chrome.runtime.onConnect.removeListener(onConnectHandler);
}



/******************************************************************************/
/******************************************************************************/
/**********           # Exportable init / halt functions             **********/
/******************************************************************************/
/******************************************************************************/


// function preinit() {
//   // urlFlags = loadFlags()
// }

export function init() {
  // SHOW SOME WARNING TO USERS ABOUT MESSING UP THEIR DATA
  enableListeners();
}

// function postinit() {}
  
export function halt() {
	disableListeners();
}
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

WARNING:  Content Security Policies are DISABLED while Analysis Mode is ON.
- This leaves you potentially vulnerable to cross-site scripting attacks!
- See disableCSPPerRequest function for more details
*/

import { csvGenerator } from "../../common/csvGenerator";
import { modes } from "../../data/modes.js";
import { defaultSettings } from "../../data/defaultSettings.js";
import { stores, storage } from "./../storage.js";
import { 
  cookiesPhrasing, 
  uspPhrasing, 
  uspCookiePhrasingList,
  doNotSellPhrasing 
} from "../../data/regex"
import psl from "psl";
import { headers } from "../../data/headers"



/******************************************************************************/
/******************************************************************************/
/**********             # Initializers (cached values)               **********/
/******************************************************************************/
/******************************************************************************/


var analysis = {};
var analysis_userend = {};
var analysis_counter = {};
var domains_collected_during_analysis = [];
var urlsWithUSPString = [];
var firstPartyDomain = "";
var changingSitesOnAnalysis = false;



/******************************************************************************/
/******************************************************************************/
/**********                       # Functions                        **********/
/******************************************************************************/
/******************************************************************************/


// Listener parameters for webRequest & webNavigation
const MOZ_REQUEST_SPEC = ["requestHeaders", "blocking"];
const MOZ_RESPONSE_SPEC = ["responseHeaders", "blocking"];
const FILTER = { urls: ["<all_urls>"] };


function updateAnalysisCounter() {

  let domains_collected = Object.keys(domains_collected_during_analysis);
  for (let i=0; i<domains_collected_during_analysis.length; i++) {
    analysis_counter[domains_collected[i]] += 1;
  }

  domains_collected_during_analysis = [];
}


async function checkForUSPString(url) {
  if (uspPhrasing.test(url)) {
    urlsWithUSPString.push(url)
  }
}

// Update analysis icon when running
function setAnalysisIcon(tabID) {
  chrome.browserAction.setIcon({ // no need for browser specific bc analysis mode is only Firefox

    tabId: tabID,
    path: "../../assets/face-icons/optmeow-face-circle-yellow-128.png",
  });
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
  setAnalysisIcon(details.tabId);   // Show analysis icon
  checkForUSPString(details.url); // Dump all URLs that contain a us_privacy string
  webRequestResponseFiltering(details);        // Filter for Do Not Sell link

  for (let signal in headers) {                // add GPC headers
    let s = headers[signal]
    details.requestHeaders.push({ name: s.name, value: s.value })
  }
  return { requestHeaders: details.requestHeaders }
}


/**
 * WARNING: Disables CSP for ALL sites while Analysis Mode is ON.
 * Catches the few sites that didn't work in our initial study.
 * https://github.com/PhilGrayson/chrome-csp-disable/blob/master/background.js
 */
function disableCSPCallback(details) {
  for (var i = 0; i < details.responseHeaders.length; i++) {
    if (details.responseHeaders[i].name.toLowerCase() === 'content-security-policy') {
      details.responseHeaders[i].value = '';
    }
  }
  return { responseHeaders: details.responseHeaders };
};
let disableCSPFilter = { urls: ['*://*/*'], types: ['main_frame', 'sub_frame'] };


var addGPCHeaders = function() {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    addGPCHeadersCallback,
    FILTER,
    MOZ_REQUEST_SPEC
  );
}

var removeGPCSignals = function() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(addGPCHeadersCallback);
}

/**
 * Fetches all US Privacy cookies on current domain that match USP phrasings 
 * from uspCookiePhrasingList in regex.js
 * @returns Promise (resolves to an array of cookies if awaited for)
 */
async function fetchUSPCookies() {
  return new Promise ((resolve, reject) => {
    let promises = [];
    let allUSPCookies = [];
    for (let i in uspCookiePhrasingList) {
      promises.push(
        new Promise ((resolve, reject) => {
          chrome.cookies.getAll({
            domain: firstPartyDomain,
            name: uspCookiePhrasingList[i]
          }, function(cookies) {
            for (let j in cookies) {
              allUSPCookies.push(cookies[j]);
            }
            // allUSPCookies.push(cookies);
            resolve(cookies);
          })
        })
      )
    }
    Promise.all(promises).then(values => {
      resolve(allUSPCookies)
    })
  })
}

/**
 * Fetches all USPAPI data by invoking a script to inject such a call onto 
 * the current webpage. The data is passed back via messages and resolved. 
 * @returns Promise (resolves to a USPAPI result object)
 */
function fetchUSPAPIData() {
  return new Promise ((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {msg: "USPAPI_FETCH_REQUEST"}, function(response) {
        function onResponseHandler(message, sender, sendResponse) {
          chrome.runtime.onMessage.removeListener(onResponseHandler);
          if (message.msg == "USPAPI_TO_BACKGROUND_FROM_FETCH_REQUEST") {
            resolve(message);
          }
        }
        chrome.runtime.onMessage.addListener(onResponseHandler);
      });
    });
  })
}

/**
 * Manually fetches all US Privacy data in both the USPAPI if it exists
 * and also US Privacy cookies if they exist. 
 * @returns Object - Contains USP cookies, USPAPI data, and the location
 */
async function fetchUSPStringData() {
  let uspCookiePhrasings = [...uspCookiePhrasingList];
  const uspapiData = await fetchUSPAPIData();
  const uspCookies = await fetchUSPCookies();   // returns array of all cookies, irrespective of order

  return {
    cookies: uspCookies,
    data: uspapiData.data,
    location: uspapiData.location
  }
}


/**
 * Initializes the analysis with a refresh after being triggered
 * 
 * (1) Query the first party domain for data recording use
 * (2) Add GPC headers
 * (3) Attach DOM property to page after reload
 */
async function runAnalysis() {
  async function afterFetchingFirstPartyDomain() {
    const uspapiData = await fetchUSPStringData();
    let url = new URL(uspapiData.location);
    let domain = parseURL(url);
    if (uspapiData.data !== "USPAPI_FAILED") {
      logData(domain, "USPAPI", uspapiData.data);
    }
    if (uspapiData.cookies) {
      logData(domain, "COOKIES", uspapiData.cookies);
    }
    changingSitesOnAnalysis = true;                     // Analysis=ON flag

    addGPCHeaders();
    chrome.tabs.reload();
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let tab = tabs[0];
    let url = new URL(tab.url);
    let parsed = psl.parse(url.hostname);
    let domain = parsed.domain;
    firstPartyDomain = domain;  // Saves first party domain to global scope

    afterFetchingFirstPartyDomain();
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  await haltAnalysis();

}

/**
 * Disables analysis collection
 */
async function haltAnalysis() {

  function afterUSPStringFetched() {
    changingSitesOnAnalysis = false;
    firstPartyDomain = "";
    updateAnalysisCounter();
    removeGPCSignals();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let tab = tabs[0];

      // Change popup icon
      chrome.browserAction.setIcon({
        tabId: tab.id,
        path: "../../assets/face-icons/icon128-face-circle.png",
      }, ()=>{});
    });
  }

  const uspapiData = await fetchUSPStringData();
  let url = new URL(uspapiData.location);
  let domain = parseURL(url);
  if (uspapiData.data !== "USPAPI_FAILED") {
    logData(domain, "USPAPI", uspapiData.data);
  }
  if (uspapiData.cookies) {
    logData(domain, "COOKIES", uspapiData.cookies);
  }
  afterUSPStringFetched();
}

/**
 * Runs `dom.js` to attach DOM signal
 * @param {object} details - retrieved info passed into callback
 */
 function addDomSignal(details) {
  chrome.tabs.executeScript(details.tabId, {
    file: "../../content-scripts/injection/gpc-dom.js",
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
    || transition === "keyword_generated"
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
  }
}

// Tentative idea:
// Make every item in here only one thing so you can easily
// convert to a spreadsheet for saving as a .csv file
var analysisUserendSkeleton = () => {
  return {
    "DO_NOT_SELL_LINK_EXISTS": null,
    "SENT_GPC": false,
    "USPAPI_BEFORE_GPC": [],
    "USPAPI_AFTER_GPC": [],
    "USPAPI_OPTED_OUT": undefined,
    "USP_COOKIES_BEFORE_GPC": [],
    "USP_COOKIES_AFTER_GPC": [],
    "USP_COOKIE_OPTED_OUT": undefined
  }
}

var analysisDataSkeletonThirdParties = () => {
  return {
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
  // This is to associate data collected during analysis w/ first party domain
  domain = changingSitesOnAnalysis ? firstPartyDomain : domain;
  let gpcStatusKey = changingSitesOnAnalysis ? "AFTER_GPC" : "BEFORE_GPC";

  // If domain doesn't exist, initialize it
  if (!analysis[domain]) {
    analysis[domain] = [];
    analysis_userend[domain] = [];
    analysis_counter[domain] = 0;
  }
  if (domains_collected_during_analysis[domain] == undefined || domains_collected_during_analysis[domain] == null) {
    domains_collected_during_analysis.push(domain);
  }
  let callIndex = analysis_counter[domain];


  // Do we associate the incoming info w/ a new request or no? Which index to save at?
  if (!analysis[domain][callIndex]) {
    analysis[domain][callIndex] = analysisDataSkeletonFirstParties();
    analysis_userend[domain] = analysisUserendSkeleton();
  }

  if (changingSitesOnAnalysis) {
    analysis[domain][callIndex]["SENT_GPC"] = true;
    analysis_userend[domain]["SENT_GPC"] = true;
  }

  // Let's assume that data does have a name property as a cookie should
  // NOTE: Cookies should be an array of "cookies" objects, not promises, etc. 
  if (command === "COOKIES") {
    analysis[domain][callIndex][gpcStatusKey]["COOKIES"] = []
    for (let i in data) {
      analysis[domain][callIndex][gpcStatusKey]["COOKIES"].push(data[i]);
    }
    
    // Detailed case for summary object
    if (gpcStatusKey == "BEFORE_GPC") {
      analysis_userend[domain]["USP_COOKIES_BEFORE_GPC"] = []
      for (let i in data) {
        if (data[i]["value"]) {
          analysis_userend[domain]["USP_COOKIES_BEFORE_GPC"].push({"value":data[i]["value"]});
        }
      }
    }
    if (gpcStatusKey == "AFTER_GPC") {
      analysis_userend[domain]["USP_COOKIES_AFTER_GPC"] = []
      for (let i in data) {
        if (data[i]["value"]) {
          analysis_userend[domain]["USP_COOKIES_AFTER_GPC"].push({"value":data[i]["value"]});
        }
        try {
          if (analysis_userend[domain]["USP_COOKIE_OPTED_OUT"] !== true) {
            let USPrivacyString = data[i].value || "";
            // Give precedence to USPAPI
            let optedOut = analysis_userend[domain]["USP_COOKIE_OPTED_OUT"];
            if (optedOut !== null || optedOut !== undefined) {
              if (USPrivacyString[2] === "Y" || USPrivacyString[2] === "y") {
                analysis_userend[domain]["USP_COOKIE_OPTED_OUT"] = true;
              } else if (USPrivacyString[2] === "-") {
                analysis_userend[domain]["USP_COOKIE_OPTED_OUT"] = "NOT_IN_CA";
              } else if (USPrivacyString[2] === "N" || USPrivacyString[2] == "n") {
                analysis_userend[domain]["USP_COOKIE_OPTED_OUT"] = false;
              } else {
                analysis_userend[domain]["USP_COOKIE_OPTED_OUT"] = null;
              }
            }
          }
        } catch (e) {
          console.error("Parsing USPAPI for analysis_userend failed.", e);
          analysis_userend[domain]["USP_COOKIE_OPTED_OUT"] = "PARSE_FAILED"; 
        }
      }
    }
  }

  if (command === "USPAPI") {
    analysis[domain][callIndex][gpcStatusKey]["USPAPI"] = []
    analysis[domain][callIndex][gpcStatusKey]["USPAPI"].push(data);
    
    // Detailed case for summary object
    if (gpcStatusKey == "BEFORE_GPC") {
      analysis_userend[domain]["USPAPI_BEFORE_GPC"] = []
      analysis_userend[domain]["USPAPI_BEFORE_GPC"].push({"uspString":data["uspString"]});
    }
    if (gpcStatusKey == "AFTER_GPC") {
      analysis_userend[domain]["USPAPI_AFTER_GPC"] = []
      analysis_userend[domain]["USPAPI_AFTER_GPC"].push({"uspString":data["uspString"]});
      try {
        let USPrivacyString = data.value || data.uspString;

        if (USPrivacyString[2] === "Y" || USPrivacyString[2] === "y") {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = true;
        } else if (USPrivacyString[2] === "-") {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = "NOT_IN_CA";
        } else if (USPrivacyString[2] === "N" || USPrivacyString[2] == "n") {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = false;
        } else {
          analysis_userend[domain]["USPAPI_OPTED_OUT"] = null;
        }
      } catch (e) {
        console.error("Parsing USPAPI for analysis_userend failed.", e);
        analysis_userend[domain]["USPAPI_OPTED_OUT"] = "PARSE_FAILED"; 
      }
    }

  }
  if (command === "DO_NOT_SELL_LINK") {
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK"] = []
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK"].push(data);
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK_EXISTS"] = true;
    analysis_userend[domain]["DO_NOT_SELL_LINK_EXISTS"] = true;
  }
  if (command === "DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING") {
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING"] = []
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK_WEB_REQUEST_FILTERING"].push(data);
    analysis[domain][callIndex][gpcStatusKey]["DO_NOT_SELL_LINK_EXISTS"] = true;
    analysis_userend[domain]["DO_NOT_SELL_LINK_EXISTS"] = true;

  }
  storage.set(stores.analysis, analysis_userend[domain], domain);
}



/******************************************************************************/
/******************************************************************************/
/**********                       # Listeners                        **********/
/******************************************************************************/
/******************************************************************************/


/**
 * Cookie listener - grabs ALL cookies as they are changed
 */
function cookiesOnChangedCallback(changeInfo) {
  (changeInfo) => { 
    if (!changeInfo.removed) {
      let cookie = changeInfo.cookie;
      let domain = cookie.domain;
      domain = domain[0] == '.' ? domain.substring(1) : domain;
      let urlObj = psl.parse(domain);

      if (cookiesPhrasing.test(cookie.name)) {
        logData(urlObj.domain, "COOKIES", cookie);
      }
    }
  } 
}

/**
 * Runs anytime the webNavigation.onCommitted listers triggers,
 * especially when making transitions from running analysis and being passive.
 * Also important in making sure all sites without anything noteworthy are logged
 * @param {Object} details 
 */
function onCommittedCallback(details) {
  // https://developer.chrome.com/docs/extensions/reference/history/#transition_types
  let validTransition = isValidTransition(details.transitionType);

  if (validTransition) {
    let url = new URL(details.url);
    let domain = parseURL(url);
    if (changingSitesOnAnalysis) {
      // add SENDING GPC TO FILE
      // Turn off changing sites on analysis 
      // sendingGPC = true;
      logData(domain, null, null);
      addDomSignal(details);
    }
  }
}

// Used for crawling
async function runAnalysisonce(location) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  let analysis_started = await storage.get(stores.settings, "ANALYSIS_STARTED");
  let url = new URL(location);
  let domain = parseURL(url);
  let analysis_domains = await storage.getAllKeys(stores.analysis);
  if ((!analysis_domains.includes(domain)) &&  (analysis_started === false)) {
    runAnalysis();
    await storage.set(stores.settings, true, "ANALYSIS_STARTED");
  }
  
  if (analysis_started === true){
    await new Promise(resolve => setTimeout(resolve, 3000));
    haltAnalysis();
    await storage.set(stores.settings, false, "ANALYSIS_STARTED");
  }
}

/**
 * Message passing listener - for collecting USPAPI call data from the window
 */
 function onMessageHandler(message, sender, sendResponse) {
  if (message.msg === "QUERY_ANALYSIS") {
    runAnalysisonce(message.location);
  }
  if (message.msg === "USPAPI_TO_BACKGROUND") {
    let url = new URL(message.location);
    let domain = parseURL(url);
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
  if (message.msg === "HALT_ANALYSIS") {
    haltAnalysis();
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
        titles: analysisUserendSkeleton()
      }
    });
  }
  if (message.msg === "CSV_DATA_REQUEST_FROM_SETTINGS") {
    chrome.runtime.sendMessage({
      msg: "CSV_DATA_RESPONSE_TO_SETTINGS",
      data: {
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
    if (message.msg === "STOP_ANALYSIS_FROM_BACKGROUND") {
      haltAnalysis();
    }
  })
}

async function exportCSV() {
  const csvData = await storage.getStore(stores.analysis)
  csvGenerator(csvData, analysisUserendSkeleton());
  return
}

function commandsHandler(command) {
  if (command === "run_analysis") {
    runAnalysis();
  }
  if (command === "halt_analysis") {
    haltAnalysis();
  }
  if (command === "export_csv") {
    exportCSV();
  }
}

/**
 * Enables all the important listeners in one place
 */
function enableListeners() {
  chrome.cookies.onChanged.addListener(cookiesOnChangedCallback);
  chrome.webNavigation.onCommitted.addListener(onCommittedCallback);
  chrome.runtime.onMessage.addListener(onMessageHandler);
  chrome.runtime.onConnect.addListener(onConnectHandler);
  chrome.commands.onCommand.addListener(commandsHandler);
  chrome.webRequest.onHeadersReceived.addListener(
    disableCSPCallback, disableCSPFilter, ['blocking', 'responseHeaders']
  );
}

function disableListeners() {
  chrome.cookies.onChanged.removeListener(cookiesOnChangedCallback);
  chrome.webNavigation.onCommitted.removeListener(onCommittedCallback);
  chrome.runtime.onMessage.removeListener(onMessageHandler);
  chrome.runtime.onConnect.removeListener(onConnectHandler);
  chrome.commands.onCommand.removeListener(commandsHandler);
  chrome.webRequest.onHeadersReceived.removeListener(disableCSPCallback);
}



/******************************************************************************/
/******************************************************************************/
/**********           # Exportable init / halt functions             **********/
/******************************************************************************/
/******************************************************************************/

export function init() {
  // SHOW SOME WARNING TO USERS ABOUT MESSING UP THEIR DATA
  enableListeners();
}

  
export function halt() {
	disableListeners();
}
